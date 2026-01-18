import { Storage } from './storage.js';
import { Mask, Validator } from './utils.js';
import { FileDB } from './db.js';
import { CID10 } from '../cid_data.js';
import { UI } from './ui.js';
import { SpeechService } from './speech.js';
import { ImageProcessor } from './image_processor.js';
import { DB_KEYS, STATUS, PAYMENT_STATUS, DEFAULTS } from './constants.js';

/**
 * Controller for the Main Form (Pericia).
 * Handles rendering, validation, saving, and interaction logic.
 */
export const FormController = {
    editors: {},
    currentPericiaId: null,
    autoSaveTimeout: null,

    // Annotation State
    canvas: null,
    ctx: null,
    currentTool: 'pen',
    currentImage: null,

    /**
     * Initializes the form controller.
     * @param {number|null} id - The ID of the pericia to load.
     */
    init(id) {
        this.renderForm(id);
    },

    /**
     * Binds static event listeners for the form buttons.
     */
    bindEvents() {
        // Buttons that exist in the static HTML structure
        const btnSave = document.getElementById('btn-save-form');
        if (btnSave) btnSave.addEventListener('click', () => this.saveForm(false));

        const btnFinalize = document.getElementById('btn-finalize-form');
        if (btnFinalize) btnFinalize.addEventListener('click', () => this.saveForm(true));

        const btnUpload = document.getElementById('btn-upload');
        if (btnUpload) btnUpload.addEventListener('click', () => this.handleFileUpload());

        const btnSaveTemplate = document.getElementById('btn-save-template');
        if (btnSaveTemplate) btnSaveTemplate.addEventListener('click', () => this.saveAsTemplate());

        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.id.replace('btn-', '')));
        });
    },

    /**
     * Renders the form with data for a specific Pericia.
     * @param {number|null} id - Pericia ID.
     */
    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Reset UI state
        this.switchTab('tab-identificacao');
        this.populateTemplateSelector();

        const setVal = (fieldId, val) => {
            const el = document.getElementById(fieldId);
            if(el) el.value = val || '';
        };

        // Populate Identification Fields
        setVal('f-numero_processo', pericia.numero_processo);
        setVal('f-vara', pericia.vara);
        setVal('f-nome_autor', pericia.nome_autor);
        setVal('f-data_nascimento', pericia.data_nascimento);
        setVal('f-cpf', pericia.cpf);
        setVal('f-rg', pericia.rg);
        setVal('f-escolaridade', pericia.escolaridade);
        this.calcAge();

        // Populate Status/Finance
        setVal('f-data_pericia', pericia.data_pericia ? pericia.data_pericia.split('T')[0] : '');
        setVal('f-valor_honorarios', pericia.valor_honorarios || 0);
        setVal('f-status_pagamento', pericia.status_pagamento || PAYMENT_STATUS.PENDING);

        // Populate Occupational History
        setVal('f-profissao', pericia.profissao);
        setVal('f-tempo_funcao', pericia.tempo_funcao);
        setVal('f-desc_atividades', pericia.desc_atividades);
        setVal('f-antecedentes', pericia.antecedentes);

        setVal('f-exames_complementares', pericia.exames_complementares);

        // Populate Conclusion
        setVal('f-discussao', pericia.discussao);
        setVal('f-cid', pericia.cid);
        setVal('f-nexo', pericia.nexo || DEFAULTS.NEXO);
        setVal('f-did', pericia.did);
        setVal('f-dii', pericia.dii);
        setVal('f-parecer', pericia.parecer || DEFAULTS.PARECER);

        // Check for Auto-Save Draft
        const draft = localStorage.getItem(DB_KEYS.DRAFT);
        if (!id && draft) {
            UI.Modal.confirm('Existe um rascunho não salvo. Deseja recuperar?', () => {
                const draftData = JSON.parse(draft);
                // Apply draft values
                Object.keys(draftData).forEach(key => {
                    if (key !== 'anamnese' && key !== 'exame_fisico' && key !== 'conclusao' && key !== 'quesitos') {
                         setVal(`f-${key}`, draftData[key]);
                    }
                });

                // Merge draft text fields into the pericia object for initQuill
                pericia.anamnese = draftData.anamnese;
                pericia.exame_fisico = draftData.exame_fisico;
                pericia.conclusao = draftData.conclusao;
                pericia.quesitos = draftData.quesitos;

                this.initQuill(pericia);
            });
        }

        this.initQuill(pericia);
        this.renderDocumentsList(pericia.documents || []);
        this.attachFormListeners();
    },

    /**
     * Attaches listeners to form inputs for auto-save and validation.
     */
    attachFormListeners() {
        // We use event delegation or direct attachment.
        // To avoid piling listeners if renderForm is called again, we can use onchange properties
        // or ensure we clone/replace elements. For simplicity in this refactor, we stick to direct properties
        // but cleaner.

        const inputs = document.querySelectorAll('#view-form input, #view-form select, #view-form textarea');
        inputs.forEach(el => {
            el.oninput = (e) => {
                this.autoSave();
                if(el.id === 'f-cpf') e.target.value = Mask.cpf(e.target.value);
                if(el.id === 'f-cid') this.handleCIDSearch(e);
            };
            el.onchange = (e) => {
                this.autoSave();
                if(el.id === 'f-data_nascimento') this.calcAge();
            };

            if(el.id === 'f-cid') {
                el.onblur = () => setTimeout(() => {
                    const suggestions = document.getElementById('cid-suggestions');
                    if (suggestions) suggestions.classList.add('hidden');
                }, 200);
            }
        });
    },

    // --- Logic Helpers ---

    switchTab(tabId) {
        if(!tabId) return;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(tabId);
        if(target) target.classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(el => {
            el.classList.remove('active');
            el.classList.add('inactive');
        });
        const btn = document.getElementById(`btn-${tabId}`);
        if(btn) {
            btn.classList.remove('inactive');
            btn.classList.add('active');
        }
    },

    calcAge() {
        const dobStr = document.getElementById('f-data_nascimento').value;
        const display = document.getElementById('f-idade-display');
        if(dobStr) {
            const dob = new Date(dobStr);
            const diff_ms = Date.now() - dob.getTime();
            const age_dt = new Date(diff_ms);
            const age = Math.abs(age_dt.getUTCFullYear() - 1970);
            display.innerText = `${age} anos`;
        } else {
            display.innerText = '';
        }
    },

    handleCIDSearch(e) {
        const query = e.target.value;
        const results = CID10.search(query);
        const ul = document.getElementById('cid-suggestions');

        ul.innerHTML = '';
        if (results.length === 0) {
            ul.classList.add('hidden');
            return;
        }

        results.forEach(item => {
            const li = document.createElement('li');
            li.className = "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-sm";
            li.innerText = `${item.code} - ${item.desc}`;
            li.onmousedown = () => {
                document.getElementById('f-cid').value = `${item.code} - ${item.desc}`;
                ul.classList.add('hidden');
                this.autoSave();
            };
            ul.appendChild(li);
        });
        ul.classList.remove('hidden');
    },

    initQuill(pericia) {
        const toolbarOptions = [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ];
        const opts = { theme: 'snow', modules: { toolbar: toolbarOptions } };

        ['q-anamnese', 'q-exame_fisico', 'q-conclusao', 'q-quesitos'].forEach(id => {
             const container = document.getElementById(id);
             if(container) {
                 const prevToolbar = container.previousElementSibling;
                 if(prevToolbar && prevToolbar.classList.contains('ql-toolbar')) {
                     prevToolbar.remove();
                 }
                 container.innerHTML = '';
             }
        });

        const createEditor = (id, key) => {
            if(!document.getElementById(id)) return;
            // eslint-disable-next-line no-undef
            const quill = new Quill('#' + id, opts);

            // Add Mic Button
            const container = quill.getModule('toolbar').container;
            const btn = document.createElement('button');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            btn.classList.add('ql-mic');
            btn.onclick = (e) => {
                e.preventDefault();
                SpeechService.toggle(quill, btn);
            };
            container.appendChild(btn);

            quill.root.innerHTML = pericia[key] || '';
            quill.on('text-change', () => this.autoSave());

            this.editors[key] = quill;
        };

        createEditor('q-anamnese', 'anamnese');
        createEditor('q-exame_fisico', 'exame_fisico');
        createEditor('q-conclusao', 'conclusao');
        createEditor('q-quesitos', 'quesitos');

        this.populateMacroSelects();
    },

    populateMacroSelects() {
        const macros = Storage.getMacros();
        ['anamnese', 'exame_fisico', 'conclusao'].forEach(cat => {
            const sel = document.getElementById(`macro-sel-${cat}`);
            if(!sel) return;

            sel.innerHTML = '<option value="">Inserir modelo...</option>';
            macros.filter(m => m.categoria === cat).forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.innerText = m.titulo;
                sel.appendChild(opt);
            });

            sel.onchange = (e) => {
                const id = e.target.value;
                if(!id) return;
                const m = macros.find(x => x.id == id);
                if(m && this.editors[cat]) {
                    const range = this.editors[cat].getSelection(true);
                    if (range) this.editors[cat].insertText(range.index, m.conteudo + '\n');
                    else this.editors[cat].insertText(this.editors[cat].getLength(), m.conteudo + '\n');
                }
                e.target.value = "";
            };
        });
    },

    collectFormData() {
        return {
            id: this.currentPericiaId,
            numero_processo: document.getElementById('f-numero_processo').value,
            vara: document.getElementById('f-vara').value,
            nome_autor: document.getElementById('f-nome_autor').value,

            data_nascimento: document.getElementById('f-data_nascimento').value,
            cpf: document.getElementById('f-cpf').value,
            rg: document.getElementById('f-rg').value,
            escolaridade: document.getElementById('f-escolaridade').value,

            profissao: document.getElementById('f-profissao').value,
            tempo_funcao: document.getElementById('f-tempo_funcao').value,
            desc_atividades: document.getElementById('f-desc_atividades').value,
            antecedentes: document.getElementById('f-antecedentes').value,

            exames_complementares: document.getElementById('f-exames_complementares').value,
            discussao: document.getElementById('f-discussao').value,
            cid: document.getElementById('f-cid').value,
            nexo: document.getElementById('f-nexo').value,
            did: document.getElementById('f-did').value,
            dii: document.getElementById('f-dii').value,
            parecer: document.getElementById('f-parecer').value,

            data_pericia: document.getElementById('f-data_pericia').value,
            valor_honorarios: parseFloat(document.getElementById('f-valor_honorarios').value || 0),
            status_pagamento: document.getElementById('f-status_pagamento').value,

            anamnese: this.editors['anamnese'] ? this.editors['anamnese'].root.innerHTML : '',
            exame_fisico: this.editors['exame_fisico'] ? this.editors['exame_fisico'].root.innerHTML : '',
            conclusao: this.editors['conclusao'] ? this.editors['conclusao'].root.innerHTML : '',
            quesitos: this.editors['quesitos'] ? this.editors['quesitos'].root.innerHTML : '',

            documents: this.currentPericiaId ? (Storage.getPericia(this.currentPericiaId).documents || []) : []
        };
    },

    autoSave() {
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const data = this.collectFormData();
            localStorage.setItem(DB_KEYS.DRAFT, JSON.stringify(data));
        }, 2000);
    },

    saveForm(finalize = false) {
        const data = this.collectFormData();
        let errors = [];

        if (finalize) {
            if (!data.numero_processo) errors.push("Número do Processo é obrigatório.");
            if (!data.nome_autor) errors.push("Nome do Autor é obrigatório.");
            if (!data.cid) errors.push("Diagnóstico (CID) é obrigatório.");
            if (!data.conclusao || data.conclusao === '<p><br></p>') errors.push("Conclusão é obrigatória.");
        }

        if (data.cpf && !Validator.cpf(data.cpf)) {
            errors.push("CPF inválido.");
            document.getElementById('f-cpf').classList.add('border-red-500');
        } else {
            document.getElementById('f-cpf').classList.remove('border-red-500');
        }

        if (errors.length > 0) {
            UI.Toast.show("Corrija os erros:\n" + errors.join('\n'), 'error');
            return;
        }

        if (finalize) data.status = STATUS.DONE;
        else if (!data.status) {
             if (data.data_pericia) data.status = STATUS.SCHEDULED;
             else data.status = STATUS.WAITING;

             if (this.currentPericiaId) {
                 const old = Storage.getPericia(this.currentPericiaId);
                 if (old && (old.status === STATUS.IN_PROGRESS || old.status === STATUS.DONE)) {
                     data.status = old.status;
                 }
             }
             if (!finalize && (data.anamnese || data.exame_fisico) && data.status !== STATUS.DONE) {
                 data.status = STATUS.IN_PROGRESS;
             }
        }

        try {
            Storage.savePericia(data);
            localStorage.removeItem(DB_KEYS.DRAFT);
            UI.Toast.show(finalize ? 'Perícia finalizada!' : 'Salvo com sucesso!', 'success');
            window.location.hash = '#dashboard';
        } catch (e) {
            UI.Toast.show(e.message, 'error');
        }
    },

    // --- Files ---

    handleFileUpload() {
        const input = document.getElementById('upload_document');
        const file = input.files[0];
        if(!file || !this.currentPericiaId) {
            UI.Toast.show('Salve a perícia antes de anexar arquivos.', 'warning');
            return;
        }

        UI.Loading.show();

        const saveCallback = (blob) => this._saveFileToDB(blob, file.name);

        if (file.type.startsWith('image/')) {
            ImageProcessor.compress(file, saveCallback);
        } else {
            saveCallback(file);
        }
    },

    _saveFileToDB(blob, originalName) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const fileId = Date.now();
            try {
                await FileDB.saveFile(fileId, content);
                const pericia = Storage.getPericia(this.currentPericiaId);
                if(!pericia.documents) pericia.documents = [];
                pericia.documents.push({ id: fileId, original_name: originalName });
                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
                document.getElementById('upload_document').value = "";
                UI.Toast.show('Arquivo anexado!', 'success');
            } catch (err) {
                UI.Toast.show('Erro ao salvar arquivo.', 'error');
            } finally {
                UI.Loading.hide();
            }
        };
        reader.readAsDataURL(blob);
    },

    renderDocumentsList(docs) {
        const ul = document.getElementById('documents-list-ul');
        if (!ul) return;
        ul.innerHTML = '';
        if(docs.length === 0) {
            ul.innerHTML = '<li class="text-gray-400 text-sm italic">Nenhum documento.</li>';
            return;
        }
        docs.forEach(doc => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 text-sm mb-1";
            const isImage = doc.original_name.match(/\.(jpg|jpeg|png|webp)$/i);

            li.innerHTML = `
                <div class="flex items-center gap-2 truncate">
                    <span class="text-blue-600 dark:text-blue-400 truncate cursor-pointer doc-link" data-id="${doc.id}" data-name="${doc.original_name}">${doc.original_name}</span>
                    ${isImage ? `<button class="text-gray-500 hover:text-blue-500 annotate-btn" data-id="${doc.id}" title="Anotar"><i class="fa-solid fa-paintbrush"></i></button>` : ''}
                </div>
                <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${doc.id}"><i class="fa-solid fa-trash"></i></button>
            `;
            ul.appendChild(li);
        });

        // Add Listeners
        ul.querySelectorAll('.doc-link').forEach(el => {
            el.onclick = () => this.downloadFile(el.dataset.id, el.dataset.name);
        });
        ul.querySelectorAll('.annotate-btn').forEach(el => {
            el.onclick = () => this.openAnnotation(el.dataset.id);
        });
        ul.querySelectorAll('.delete-btn').forEach(el => {
            el.onclick = () => this.deleteFile(el.dataset.id);
        });
    },

    async downloadFile(docId, name) {
        try {
            const content = await FileDB.getFile(parseInt(docId));
            if(content) {
                const a = document.createElement('a');
                a.href = content;
                a.download = name;
                a.click();
            } else {
                UI.Toast.show('Arquivo não encontrado.', 'error');
            }
        } catch (e) {
            UI.Toast.show('Erro ao baixar arquivo.', 'error');
        }
    },

    deleteFile(docId) {
        UI.Modal.confirm('Excluir arquivo?', () => {
            FileDB.deleteFile(parseInt(docId)).then(() => {
                const pericia = Storage.getPericia(this.currentPericiaId);
                pericia.documents = pericia.documents.filter(d => d.id != docId);
                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
                UI.Toast.show('Arquivo excluído.', 'info');
            });
        });
    },

    // --- Templates ---

    populateTemplateSelector() {
        const selector = document.getElementById('template-selector');
        if(!selector) return;
        selector.innerHTML = '<option value="">Carregar Template...</option>';
        Storage.getTemplates().forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = t.title;
            selector.appendChild(opt);
        });

        selector.onchange = (e) => this.loadTemplate(e.target.value);
    },

    saveAsTemplate() {
        const title = UI.Modal.prompt("Nome do Template:");
        if(!title) return;
        const data = this.collectFormData();
        delete data.id; delete data.numero_processo; delete data.nome_autor;
        delete data.cpf; delete data.rg; delete data.data_nascimento; delete data.documents;
        Storage.addTemplate({ title, data });
        this.populateTemplateSelector();
        UI.Toast.show('Template salvo!', 'success');
    },

    loadTemplate(id) {
        if(!id) return;
        UI.Modal.confirm("Carregar template? Isso substituirá os dados atuais.", () => {
            const t = Storage.getTemplates().find(x => x.id == id);
            if(t) {
                const data = t.data;
                Object.keys(data).forEach(key => {
                    const el = document.getElementById(`f-${key}`);
                    if(el) el.value = data[key] || '';
                });
                if (this.editors['anamnese']) this.editors['anamnese'].root.innerHTML = data.anamnese || '';
                if (this.editors['exame_fisico']) this.editors['exame_fisico'].root.innerHTML = data.exame_fisico || '';
                if (this.editors['conclusao']) this.editors['conclusao'].root.innerHTML = data.conclusao || '';
                if (this.editors['quesitos']) this.editors['quesitos'].root.innerHTML = data.quesitos || '';
            }
        });
        document.getElementById('template-selector').value = "";
    },

    // --- Annotation ---

    async openAnnotation(docId) {
        const content = await FileDB.getFile(parseInt(docId));
        if (!content) return;

        const modal = document.getElementById('annotation-modal');
        const canvas = document.getElementById('annotation-canvas');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            const container = canvas.parentElement;
            const aspect = img.width / img.height;
            let width = container.clientWidth;
            let height = width / aspect;
            if (height > container.clientHeight) {
                height = container.clientHeight;
                width = height * aspect;
            }
            canvas.width = width;
            canvas.height = height;
            this.ctx.drawImage(img, 0, 0, width, height);
            this.currentImage = img;

            modal.classList.remove('hidden');
            this.initCanvasEvents();
        };
        img.src = content;
    },

    initCanvasEvents() {
        if(this.canvas.getAttribute('data-init')) return;
        let drawing = false;
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        this.canvas.onmousedown = (e) => {
            drawing = true;
            this.ctx.beginPath();
            const p = getPos(e);
            this.ctx.moveTo(p.x, p.y);
        };
        this.canvas.onmousemove = (e) => {
            if(!drawing) return;
            const p = getPos(e);
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = document.getElementById('annotation-color').value;
            this.ctx.lineTo(p.x, p.y);
            this.ctx.stroke();
        };
        this.canvas.onmouseup = () => drawing = false;
        this.canvas.setAttribute('data-init', 'true');
    },

    saveAnnotation() {
        const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        const pericia = Storage.getPericia(this.currentPericiaId);
        pericia.documents.push({
            id: Date.now(),
            original_name: `Anotação_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`
        });
        const fileId = pericia.documents[pericia.documents.length-1].id;
        FileDB.saveFile(fileId, dataUrl).then(() => {
            Storage.savePericia(pericia);
            this.renderDocumentsList(pericia.documents);
            document.getElementById('annotation-modal').classList.add('hidden');
            UI.Toast.show('Anotação salva.', 'success');
        });
    }
};
