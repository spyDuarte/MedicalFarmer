import { Storage } from './storage.js';
import { Mask, Validator, JSONUtils, Utils } from './utils.js';
import { FileDB } from './db.js';
import { CID10 } from './cid_data.js';
import { UI } from './ui.js';
import { SpeechService } from './speech.js';
import { ImageProcessor } from './image_processor.js';
import { DB_KEYS, STATUS, PAYMENT_STATUS, DEFAULTS, UI_STRINGS } from './constants.js';
import { Binder } from './binder.js';

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
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('click', fn);
        };

        bind('btn-save-form', () => this.saveForm(false));
        bind('btn-finalize-form', () => this.saveForm(true));
        bind('btn-upload', () => this.handleFileUpload());
        bind('btn-save-template', () => this.saveAsTemplate());

        this.bindAnnotationEvents();
    },

    bindAnnotationEvents() {
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('click', fn);
        };

        bind('btn-annotate-pen', () => { this.currentTool = 'pen'; });
        bind('btn-annotate-text', () => { this.currentTool = 'text'; });
        bind('btn-annotate-clear', () => {
             const canvas = document.getElementById('annotation-canvas');
             const ctx = canvas.getContext('2d');
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             if(this.currentImage) ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height);
        });
        bind('btn-annotate-save', () => this.saveAnnotation());

        // Modal Close
        const closeAnnotation = () => {
             const modal = document.getElementById('annotation-modal');
             modal.classList.add('hidden');
             UI.Modal.releaseFocus(modal);
        };
        bind('btn-close-annotation-x', closeAnnotation);
        bind('btn-close-annotation-cancel', closeAnnotation);
    },

    /**
     * Renders the form with data for a specific Pericia.
     * @param {number|null} id - Pericia ID.
     */
    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Reset UI state
        // this.switchTab('tab-identificacao'); // Removed
        this.populateTemplateSelector();

        // Use Binder to populate fields
        const container = document.getElementById('view-form');
        Binder.bindToView(container, pericia);

        // Handle defaults
        if (!id) {
            const defaults = {
                tipoAcao: "Trabalhista",
                maoDominante: "Destro",
                objetivo: DEFAULTS.OBJETIVO,
                metodologia: DEFAULTS.METODOLOGIA,
                assistentes: "Ausentes",
                statusPagamento: PAYMENT_STATUS.PENDING,
                prognostico: "Bom",
                necessidadeAssistencia: "Não",
                nexo: DEFAULTS.NEXO,
                parecer: DEFAULTS.PARECER
            };
            Binder.bindToView(container, defaults);
        }

        // Specific formatting
        if (pericia.dataPericia) {
            const dateInput = document.getElementById('f-data_pericia');
            if(dateInput) dateInput.value = pericia.dataPericia.split('T')[0];
        }

        this.calcAge();

        // Auto-Save Recovery
        const draft = localStorage.getItem(DB_KEYS.DRAFT);
        if (!id && draft) {
            UI.Modal.confirm('Existe um rascunho não salvo. Deseja recuperar?', () => {
                const draftData = JSONUtils.parse(draft, null, 'rascunho');
                if (!draftData) {
                    UI.Toast.show('Não foi possível recuperar o rascunho.', 'warning');
                    return;
                }

                Binder.bindToView(container, draftData);
                // Merge draft text fields
                pericia.anamnese = draftData.anamnese;
                pericia.exameFisico = draftData.exameFisico;
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
        const inputs = document.querySelectorAll('#view-form input, #view-form select, #view-form textarea');
        inputs.forEach(el => {
            el.oninput = (e) => {
                this.autoSave();
                if(el.id === 'f-cpf') e.target.value = Mask.cpf(e.target.value);
                if(el.id === 'f-cep') {
                    e.target.value = Mask.cep(e.target.value);
                    if (e.target.value.length === 9) this.handleCEPSearch(e.target.value);
                }
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

    calcAge() {
        const dobInput = document.getElementById('f-data_nascimento');
        const display = document.getElementById('f-idade-display');
        if(!dobInput || !display) return;

        const dobStr = dobInput.value;
        if(dobStr) {
            const dob = new Date(dobStr);
            if(!isNaN(dob.getTime())) {
                const diff_ms = Date.now() - dob.getTime();
                const age_dt = new Date(diff_ms);
                const age = Math.abs(age_dt.getUTCFullYear() - 1970);
                display.innerText = `${age} anos`;
            }
        } else {
            display.innerText = '';
        }
    },

    handleCIDSearch(e) {
        const query = e.target.value;
        const results = CID10.search(query);
        const ul = document.getElementById('cid-suggestions');
        if(!ul) return;

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

    async handleCEPSearch(cep) {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        const loading = document.getElementById('cep-loading');
        if (loading) loading.classList.remove('hidden');

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                const addressModel = {
                    endereco: {
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        uf: data.uf
                    }
                };
                Binder.bindToView(document.getElementById('view-form'), addressModel, true);
                const numInput = document.getElementById('f-numero');
                if(numInput) numInput.focus();
                this.autoSave();
            } else {
                 UI.Toast.show('CEP não encontrado.', 'warning');
            }
        } catch (e) {
            console.error('CEP Error:', e);
            UI.Toast.show('Erro ao buscar CEP.', 'error');
        } finally {
            if (loading) loading.classList.add('hidden');
        }
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
        createEditor('q-exame_fisico', 'exameFisico');
        createEditor('q-conclusao', 'conclusao');
        createEditor('q-quesitos', 'quesitos');

        this.populateMacroSelects();
    },

    populateMacroSelects() {
        const macros = Storage.getMacros();
        const catMap = {
            'anamnese': 'anamnese',
            'exame_fisico': 'exameFisico',
            'conclusao': 'conclusao'
        };

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

            // Remove old listener if needed? (Not easy without stored reference)
            // Just overwriting onchange property is simpler here than addEventListener for cleanup.
            sel.onchange = (e) => {
                const id = e.target.value;
                if(!id) return;
                // eslint-disable-next-line eqeqeq
                const m = macros.find(x => x.id == id);
                const editorKey = catMap[cat];
                if(m && this.editors[editorKey]) {
                    const range = this.editors[editorKey].getSelection(true);
                    if (range) this.editors[editorKey].insertText(range.index, m.conteudo + '\n');
                    else this.editors[editorKey].insertText(this.editors[editorKey].getLength(), m.conteudo + '\n');
                }
                e.target.value = "";
            };
        });
    },

    collectFormData() {
        const container = document.getElementById('view-form');
        const data = Binder.bindToModel(container);

        if(this.currentPericiaId) data.id = this.currentPericiaId;

        // Add rich text content
        data.anamnese = this.editors['anamnese'] ? this.editors['anamnese'].root.innerHTML : '';
        data.exameFisico = this.editors['exameFisico'] ? this.editors['exameFisico'].root.innerHTML : '';
        data.conclusao = this.editors['conclusao'] ? this.editors['conclusao'].root.innerHTML : '';
        data.quesitos = this.editors['quesitos'] ? this.editors['quesitos'].root.innerHTML : '';

        // Preserve documents
        data.documents = this.currentPericiaId ? (Storage.getPericia(this.currentPericiaId).documents || []) : [];

        return data;
    },

    autoSave: Utils.debounce(function() {
        const data = this.collectFormData();
        localStorage.setItem(DB_KEYS.DRAFT, JSON.stringify(data));
    }, 2000),

    saveForm(finalize = false) {
        const data = this.collectFormData();
        const { valid, errors } = this.validateData(data, finalize);

        if (!valid) {
            UI.Toast.show("Corrija os erros:\n" + errors.join('\n'), 'error');
            return;
        }

        if (finalize) data.status = STATUS.DONE;
        else if (!data.status) {
             if (data.dataPericia) data.status = STATUS.SCHEDULED;
             else data.status = STATUS.WAITING;

             if (this.currentPericiaId) {
                 const old = Storage.getPericia(this.currentPericiaId);
                 if (old && (old.status === STATUS.IN_PROGRESS || old.status === STATUS.DONE)) {
                     data.status = old.status;
                 }
             }
             if (!finalize && (data.anamnese || data.exameFisico) && data.status !== STATUS.DONE) {
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
                pericia.documents.push({ id: fileId, originalName: originalName });
                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
                const input = document.getElementById('upload_document');
                if(input) input.value = "";
                UI.Toast.show('Arquivo anexado!', 'success');
            } catch (err) {
                console.error(err);
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
            const isImage = doc.originalName.match(/\.(jpg|jpeg|png|webp)$/i);

            const divLeft = document.createElement('div');
            divLeft.className = "flex items-center gap-2 truncate";

            const spanName = document.createElement('span');
            spanName.className = "text-blue-600 dark:text-blue-400 truncate cursor-pointer doc-link";
            spanName.textContent = doc.originalName;
            spanName.onclick = () => this.downloadFile(doc.id, doc.originalName);
            divLeft.appendChild(spanName);

            if (isImage) {
                const btnAnnotate = document.createElement('button');
                btnAnnotate.className = "text-gray-500 hover:text-blue-500";
                btnAnnotate.title = "Anotar";
                btnAnnotate.innerHTML = '<i class="fa-solid fa-paintbrush"></i>';
                btnAnnotate.onclick = () => this.openAnnotation(doc.id);
                divLeft.appendChild(btnAnnotate);
            }

            const btnDelete = document.createElement('button');
            btnDelete.className = "text-red-500 hover:text-red-700";
            btnDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
            // eslint-disable-next-line eqeqeq
            btnDelete.onclick = () => this.deleteFile(doc.id);

            li.appendChild(divLeft);
            li.appendChild(btnDelete);
            ul.appendChild(li);
        });
    },

    async downloadFile(docId, name) {
        try {
            const content = await FileDB.getFile(parseInt(docId, 10));
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
            FileDB.deleteFile(parseInt(docId, 10)).then(() => {
                const pericia = Storage.getPericia(this.currentPericiaId);
                // eslint-disable-next-line eqeqeq
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
        // Clear specific data
        delete data.id; delete data.numeroProcesso; delete data.nomeAutor;
        delete data.cpf; delete data.rg; delete data.dataNascimento; delete data.documents;

        Storage.addTemplate({ title, data });
        this.populateTemplateSelector();
        UI.Toast.show('Template salvo!', 'success');
    },

    loadTemplate(id) {
        if(!id) return;
        UI.Modal.confirm("Carregar template? Isso substituirá os dados atuais.", () => {
            // eslint-disable-next-line eqeqeq
            const t = Storage.getTemplates().find(x => x.id == id);
            if(t) {
                const data = this._normalizeLegacyData(t.data);
                Binder.bindToView(document.getElementById('view-form'), data);

                if (this.editors['anamnese']) this.editors['anamnese'].root.innerHTML = data.anamnese || '';
                if (this.editors['exameFisico']) this.editors['exameFisico'].root.innerHTML = data.exameFisico || '';
                if (this.editors['conclusao']) this.editors['conclusao'].root.innerHTML = data.conclusao || '';
                if (this.editors['quesitos']) this.editors['quesitos'].root.innerHTML = data.quesitos || '';
            }
        });
        document.getElementById('template-selector').value = "";
    },

    _normalizeLegacyData(data) {
        const newData = { ...data };
        const map = {
            'numero_processo': 'numeroProcesso',
            'nome_autor': 'nomeAutor',
            'data_nascimento': 'dataNascimento',
            'estado_civil': 'estadoCivil',
            'mao_dominante': 'maoDominante',
            'data_pericia': 'dataPericia',
            'valor_honorarios': 'valorHonorarios',
            'status_pagamento': 'statusPagamento',
            'local_pericia': 'localPericia',
            'data_acidente': 'dataAcidente',
            'tempo_funcao': 'tempoFuncao',
            'desc_atividades': 'descAtividades',
            'historico_previdenciario': 'historicoPrevidenciario',
            'exames_complementares': 'examesComplementares',
            'exame_fisico': 'exameFisico',
            'necessidade_assistencia': 'necessidadeAssistencia'
        };

        Object.keys(data).forEach(key => {
            if (map[key] && !newData[map[key]]) {
                newData[map[key]] = data[key];
            }
        });
        return newData;
    },

    // --- Annotation ---

    async openAnnotation(docId) {
        const content = await FileDB.getFile(parseInt(docId, 10));
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
            UI.Modal.trapFocus(modal);
        };
        img.src = content;
    },

    initCanvasEvents() {
        if(this.canvas.getAttribute('data-init')) return;
        let drawing = false;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Handle touch
            if(e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const start = (e) => {
            if(e.type === 'touchstart') e.preventDefault();
            drawing = true;
            this.ctx.beginPath();
            const p = getPos(e);
            this.ctx.moveTo(p.x, p.y);
        };

        const move = (e) => {
            if(!drawing) return;
            if(e.type === 'touchmove') e.preventDefault();
            const p = getPos(e);
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = document.getElementById('annotation-color').value;
            this.ctx.lineTo(p.x, p.y);
            this.ctx.stroke();
        };

        const end = () => drawing = false;

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('mouseup', end);
        this.canvas.addEventListener('mouseleave', end);

        this.canvas.addEventListener('touchstart', start);
        this.canvas.addEventListener('touchmove', move);
        this.canvas.addEventListener('touchend', end);

        this.canvas.setAttribute('data-init', 'true');
    },

    saveAnnotation() {
        const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        const pericia = Storage.getPericia(this.currentPericiaId);
        pericia.documents.push({
            id: Date.now(),
            originalName: `Anotação_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`
        });
        const fileId = pericia.documents[pericia.documents.length-1].id;
        FileDB.saveFile(fileId, dataUrl).then(() => {
            Storage.savePericia(pericia);
            this.renderDocumentsList(pericia.documents);
            const modal = document.getElementById('annotation-modal');
            modal.classList.add('hidden');
            UI.Modal.releaseFocus(modal);
            UI.Toast.show('Anotação salva.', 'success');
        });
    },

    /**
     * Validates form data.
     * @param {Object} data - The form data object.
     * @param {boolean} finalize - Whether it's a final submission.
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateData(data, finalize) {
        let errors = [];
        const setError = (id, hasError) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (hasError) {
                el.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                el.setAttribute('aria-invalid', 'true');
            } else {
                el.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                el.removeAttribute('aria-invalid');
            }
        };

        // Reset previous errors
        ['f-numero_processo', 'f-nome_autor', 'f-cid', 'f-cpf'].forEach(id => setError(id, false));

        if (finalize) {
            if (!data.numeroProcesso) {
                errors.push(UI_STRINGS.ERROR_PROCESS);
                setError('f-numero_processo', true);
            }
            if (!data.nomeAutor) {
                errors.push(UI_STRINGS.ERROR_AUTHOR);
                setError('f-nome_autor', true);
            }
            if (!data.cid) {
                errors.push(UI_STRINGS.ERROR_CID);
                setError('f-cid', true);
            }
            if (!data.conclusao || data.conclusao === '<p><br></p>') {
                errors.push(UI_STRINGS.ERROR_CONCLUSION);
                // Rich text editors need different handling, usually a border around container
                const q = document.getElementById('q-conclusao');
                if(q) q.classList.add('border-red-500');
            } else {
                const q = document.getElementById('q-conclusao');
                if(q) q.classList.remove('border-red-500');
            }
        }

        if (data.cpf && !Validator.cpf(data.cpf)) {
            errors.push(UI_STRINGS.ERROR_CPF);
            setError('f-cpf', true);
        }

        return { valid: errors.length === 0, errors };
    }
};
