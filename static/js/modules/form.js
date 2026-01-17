import { Storage } from './storage.js';
import { Mask, Validator } from './utils.js';
import { FileDB } from './db.js';
import { CID10 } from '../cid_data.js';

export const FormController = {
    editors: {},
    currentPericiaId: null,
    autoSaveTimeout: null,

    // Annotation
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentTool: 'pen',
    currentImage: null,
    originalDocId: null,

    init(id) {
        this.renderForm(id);
    },

    // --- Core Form Rendering ---
    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Default Tab
        this.switchTab('tab-identificacao');
        this.populateTemplateSelector();

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.value = val || '';
        };

        // Populate fields
        setVal('f-numero_processo', pericia.numero_processo);
        setVal('f-vara', pericia.vara);
        setVal('f-nome_autor', pericia.nome_autor);
        setVal('f-data_nascimento', pericia.data_nascimento);
        setVal('f-cpf', pericia.cpf);
        setVal('f-rg', pericia.rg);
        setVal('f-escolaridade', pericia.escolaridade);
        this.calcAge();

        setVal('f-data_pericia', pericia.data_pericia ? pericia.data_pericia.split('T')[0] : '');
        setVal('f-valor_honorarios', pericia.valor_honorarios || 0);
        setVal('f-status_pagamento', pericia.status_pagamento || 'Pendente');

        setVal('f-profissao', pericia.profissao);
        setVal('f-tempo_funcao', pericia.tempo_funcao);
        setVal('f-desc_atividades', pericia.desc_atividades);
        setVal('f-antecedentes', pericia.antecedentes);

        setVal('f-exames_complementares', pericia.exames_complementares);

        setVal('f-discussao', pericia.discussao);
        setVal('f-cid', pericia.cid);
        setVal('f-nexo', pericia.nexo || 'Não há nexo');
        setVal('f-did', pericia.did);
        setVal('f-dii', pericia.dii);
        setVal('f-parecer', pericia.parecer || 'Capto');

        // Check for Auto-Save
        const draft = localStorage.getItem('pericia_draft');
        if (!id && draft) {
            if(confirm('Existe um rascunho não salvo. Deseja recuperar?')) {
                const draftData = JSON.parse(draft);
                // Apply draft values to fields
                Object.keys(draftData).forEach(key => {
                    const el = document.getElementById(`f-${key}`);
                    if(el) el.value = draftData[key] || '';
                });
                pericia.anamnese = draftData.anamnese;
                pericia.exame_fisico = draftData.exame_fisico;
                pericia.conclusao = draftData.conclusao;
                pericia.quesitos = draftData.quesitos;
            } else {
                localStorage.removeItem('pericia_draft');
            }
        }

        this.initQuill(pericia);
        this.renderDocumentsList(pericia.documents || []);

        // Add Listeners (Auto-Save + Masks)
        document.querySelectorAll('#view-form input, #view-form select, #view-form textarea').forEach(el => {
            const newEl = el.cloneNode(true);
            newEl.value = el.value; // Restore dynamic value
            el.parentNode.replaceChild(newEl, el);

            newEl.addEventListener('input', () => this.autoSave());
            newEl.addEventListener('change', () => this.autoSave());

            if(newEl.id === 'f-cpf') {
                newEl.addEventListener('input', (e) => e.target.value = Mask.cpf(e.target.value));
            }
            if(newEl.id === 'f-cid') {
                newEl.addEventListener('input', (e) => this.handleCIDSearch(e));
                newEl.addEventListener('blur', () => setTimeout(() => document.getElementById('cid-suggestions').classList.add('hidden'), 200));
            }
             if(newEl.id === 'f-data_nascimento') {
                newEl.addEventListener('change', () => this.calcAge());
            }
        });
    },

    // --- Logic Helpers ---
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(el => {
            el.classList.remove('active');
            el.classList.add('inactive');
        });
        document.getElementById(`btn-${tabId}`).classList.remove('inactive');
        document.getElementById(`btn-${tabId}`).classList.add('active');
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
            li.onmousedown = () => { // mousedown fires before blur
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

        // Cleanup old
        document.querySelectorAll('.ql-toolbar').forEach(e => e.remove());

        const createEditor = (id, key) => {
            // Check if container exists
            if(!document.getElementById(id)) return;
            // Clear content
            document.getElementById(id).innerHTML = '';

            const quill = new Quill('#' + id, opts);

            // Add Mic
            const container = quill.getModule('toolbar').container;
            const btn = document.createElement('button');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            btn.classList.add('ql-mic');
            btn.onclick = (e) => { e.preventDefault(); this.toggleSpeech(quill, btn); };
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

            const newSel = sel.cloneNode(true);
            sel.parentNode.replaceChild(newSel, sel);

            newSel.addEventListener('change', (e) => {
                const id = e.target.value;
                if(!id) return;
                const m = macros.find(x => x.id == id);
                if(m && this.editors[cat]) {
                    const range = this.editors[cat].getSelection(true);
                    if (range) this.editors[cat].insertText(range.index, m.conteudo + '\n');
                    else this.editors[cat].insertText(this.editors[cat].getLength(), m.conteudo + '\n');
                }
                e.target.value = "";
            });
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
            localStorage.setItem('pericia_draft', JSON.stringify(data));
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
            alert("Corrija os erros:\n" + errors.join('\n'));
            return;
        }

        if (finalize) data.status = 'Concluido';
        else if (!data.status) {
             if (data.data_pericia) data.status = 'Agendado';
             else data.status = 'Aguardando';

             if (this.currentPericiaId) {
                 const old = Storage.getPericia(this.currentPericiaId);
                 if (old.status === 'Em Andamento' || old.status === 'Concluido') data.status = old.status;
             }
             if (!finalize && (data.anamnese || data.exame_fisico) && data.status !== 'Concluido') {
                 data.status = 'Em Andamento';
             }
        }

        Storage.savePericia(data);
        localStorage.removeItem('pericia_draft');

        // Using a global Toast or alert here? Let's use alert for simplicity in this module context or we need to import a UI service
        // Ideally we pass a callback or return promise.
        // For now, let's assume the router handles the transition, but we need to notify user.
        alert(finalize ? 'Perícia finalizada!' : 'Salvo com sucesso!');
        window.location.hash = '#dashboard';
    },

    // --- Files ---
    handleFileUpload() {
        const input = document.getElementById('upload_document');
        const file = input.files[0];
        if(!file || !this.currentPericiaId) {
            alert('Salve a perícia antes de anexar arquivos.');
            return;
        }

        if (file.type.startsWith('image/')) {
            this.compressImage(file, (compressedBlob) => {
                this._saveFileToDB(compressedBlob, file.name);
            });
        } else {
            this._saveFileToDB(file, file.name);
        }
    },

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => { callback(blob); }, 'image/jpeg', 0.7);
            };
        };
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
            } catch (err) {
                console.error(err);
                alert('Erro ao salvar arquivo.');
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
                alert('Arquivo não encontrado.');
            }
        } catch (e) {
            console.error(e);
        }
    },

    deleteFile(docId) {
        if(confirm('Excluir arquivo?')) {
            FileDB.deleteFile(parseInt(docId)).then(() => {
                const pericia = Storage.getPericia(this.currentPericiaId);
                pericia.documents = pericia.documents.filter(d => d.id != docId);
                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
            });
        }
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

        // Remove old listener if any (cloning trick)
        const newSel = selector.cloneNode(true);
        selector.parentNode.replaceChild(newSel, selector);

        newSel.onchange = (e) => this.loadTemplate(e.target.value);
    },

    saveAsTemplate() {
        const title = prompt("Nome do Template:");
        if(!title) return;
        const data = this.collectFormData();
        delete data.id; delete data.numero_processo; delete data.nome_autor;
        delete data.cpf; delete data.rg; delete data.data_nascimento; delete data.documents;
        Storage.addTemplate({ title, data });
        this.populateTemplateSelector();
        alert('Template salvo!');
    },

    loadTemplate(id) {
        if(!id) return;
        if(!confirm("Carregar template? Isso substituirá os dados atuais.")) {
            document.getElementById('template-selector').value = "";
            return;
        }
        const t = Storage.getTemplates().find(x => x.id == id);
        if(t) {
            const data = t.data;
            Object.keys(data).forEach(key => {
                const el = document.getElementById(`f-${key}`);
                if(el) el.value = data[key] || '';
            });
            this.editors['anamnese'].root.innerHTML = data.anamnese || '';
            this.editors['exame_fisico'].root.innerHTML = data.exame_fisico || '';
            this.editors['conclusao'].root.innerHTML = data.conclusao || '';
            this.editors['quesitos'].root.innerHTML = data.quesitos || '';
        }
        document.getElementById('template-selector').value = "";
    },

    // --- Speech ---
    toggleSpeech(quill, btn) {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Navegador não suporta reconhecimento de voz.");
            return;
        }
        if (this.recognition && this.recognition.started) {
            this.recognition.stop();
            this.recognition.started = false;
            btn.classList.remove('text-red-600', 'animate-pulse');
            return;
        }
        this.recognition = new webkitSpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.onstart = () => {
            this.recognition.started = true;
            btn.classList.add('text-red-600', 'animate-pulse');
        };
        this.recognition.onend = () => {
            this.recognition.started = false;
            btn.classList.remove('text-red-600', 'animate-pulse');
        };
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) transcript += event.results[i][0].transcript + ' ';
            }
            if (transcript) {
                const range = quill.getSelection(true);
                quill.insertText(range.index || quill.getLength(), transcript);
            }
        };
        this.recognition.start();
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
        // We need to save the file content to DB too!
        // The original app code had a bug here, it saved content to DB in memory but pushed to documents list.
        // Let's fix:
        const fileId = pericia.documents[pericia.documents.length-1].id;
        FileDB.saveFile(fileId, dataUrl).then(() => {
            Storage.savePericia(pericia);
            this.renderDocumentsList(pericia.documents);
            document.getElementById('annotation-modal').classList.add('hidden');
        });
    }
};
