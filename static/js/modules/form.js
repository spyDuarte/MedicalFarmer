import { Storage } from './storage.js';
import { Mask, Validator } from './utils.js';
import { FileDB } from './db.js';
import { CID10 } from '../cid_data.js';
import { Templates } from './template_definitions.js';
import { FormRenderer } from './form_renderer.js';

export const FormController = {
    editors: {},
    currentPericiaId: null,
    autoSaveTimeout: null,
    currentTemplateId: 'previdenciaria', // Default

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

    changeReportType(type) {
        if(confirm('Mudar o tipo pode perder dados não salvos. Continuar?')) {
            this.currentTemplateId = type;
            this.renderForm(this.currentPericiaId, true); // Force re-render
        } else {
             // Revert select
             document.getElementById('report-type-selector').value = this.currentTemplateId;
        }
    },

    // --- Core Form Rendering ---
    renderForm(id, forceRender = false) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Determine Template
        if (pericia.template_type) {
            this.currentTemplateId = pericia.template_type;
        }

        // Update Selector UI
        const typeSelector = document.getElementById('report-type-selector');
        if(typeSelector) typeSelector.value = this.currentTemplateId;

        // Render Structure
        const template = Templates[this.currentTemplateId] || Templates.previdenciaria;
        FormRenderer.render(template, 'dynamic-form-container', this);

        // Default Tab
        const firstTab = template.sections[0].id;
        this.switchTab(`tab-${firstTab}`);

        this.populateTemplateSelector();

        // Populate fields
        // Helper to check if field exists before setting
        const setVal = (key, val) => {
             const el = document.getElementById(`f-${key}`);
             if(el) {
                 if(el.tagName === 'DIV' && el.querySelector('input')) {
                      // complex field like cid_search
                      el.querySelector('input').value = val || '';
                 } else {
                      el.value = val || '';
                 }
             }
        };

        // We can just loop through data keys and try to find matching fields
        // But we should prioritize known mapped fields
        Object.keys(pericia).forEach(key => {
            if(key === 'documents') return;
            // Handle Rich Text separately
            if(['anamnese', 'exame_fisico', 'conclusao', 'quesitos'].includes(key)) return;

            setVal(key, pericia[key]);
        });

        // Special handling for Age calculation if dob exists
        this.calcAge();

        // Check for Auto-Save
        const draft = localStorage.getItem('pericia_draft');
        if (!id && draft) {
            if(confirm('Existe um rascunho não salvo. Deseja recuperar?')) {
                const draftData = JSON.parse(draft);
                // Apply draft values
                 Object.keys(draftData).forEach(key => {
                    setVal(key, draftData[key]);
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

        // Listeners are already bound by FormRenderer for inputs
    },

    // --- Logic Helpers ---
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        const tab = document.getElementById(tabId);
        if(tab) tab.classList.remove('hidden');

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
        const dobInput = document.getElementById('f-data_nascimento');
        if(!dobInput) return;

        const dobStr = dobInput.value;
        const display = document.getElementById('f-idade_display'); // Updated ID from definition
        if(dobStr && display) {
            const dob = new Date(dobStr);
            const diff_ms = Date.now() - dob.getTime();
            const age_dt = new Date(diff_ms);
            const age = Math.abs(age_dt.getUTCFullYear() - 1970);
            display.innerText = `${age} anos`;
        } else if (display) {
            display.innerText = '';
        }
    },

    handleCIDSearch(e, ulId, inputId) {
        const query = e.target.value;
        const results = CID10.search(query);
        const ul = document.getElementById(ulId);

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
                document.getElementById(inputId).value = `${item.code} - ${item.desc}`;
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

        // Cleanup old toolbars in case of re-render
        // With dynamic renderer, we create new containers, but Quill appends toolbar before container
        // We need to be careful not to init twice

        const initEditor = (key) => {
            const id = `q-${key}`;
            const el = document.getElementById(id);
            if(!el) return;

            // Check if already initialized? Quill modifies DOM class
            if(el.classList.contains('ql-container')) {
                 // Already init, just set content
                 // But wait, if we re-rendered HTML, the DOM node is new, so it shouldn't have class
            }

            el.innerHTML = ''; // Safe clear
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

        // Find which editors are present in the current template
        // We can scan the DOM for ids starting with q-
        document.querySelectorAll('[id^="q-"]').forEach(el => {
             const key = el.id.substring(2);
             initEditor(key);
        });

        this.populateMacroSelects();
    },

    populateMacroSelects() {
        const macros = Storage.getMacros();

        document.querySelectorAll('[id^="macro-sel-"]').forEach(sel => {
             const key = sel.id.substring(10); // remove macro-sel-

             sel.innerHTML = '<option value="">Inserir modelo...</option>';
             // Filter macros by category or show all if category matches key?
             // Standard keys: anamnese, exame_fisico, conclusao.
             // If key is different, maybe just show all or none.

             macros.filter(m => m.categoria === key).forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.innerText = m.titulo;
                sel.appendChild(opt);
            });

            // Re-attach listener
             const newSel = sel.cloneNode(true);
             sel.parentNode.replaceChild(newSel, sel);

             newSel.addEventListener('change', (e) => {
                const id = e.target.value;
                if(!id) return;
                const m = macros.find(x => x.id == id);
                if(m && this.editors[key]) {
                    const range = this.editors[key].getSelection(true);
                    if (range) this.editors[key].insertText(range.index, m.conteudo + '\n');
                    else this.editors[key].insertText(this.editors[key].getLength(), m.conteudo + '\n');
                }
                e.target.value = "";
            });
        });
    },

    collectFormData() {
        const data = {
            id: this.currentPericiaId,
            template_type: this.currentTemplateId,
            documents: this.currentPericiaId ? (Storage.getPericia(this.currentPericiaId).documents || []) : []
        };

        // Collect all inputs starting with f-
        document.querySelectorAll('[id^="f-"]').forEach(el => {
            const key = el.id.substring(2);
            if(el.tagName === 'SPAN') return; // Display fields
            if(el.type === 'file') return; // Uploads handled separately

            data[key] = el.value;
        });

        // Collect Editors
        Object.keys(this.editors).forEach(key => {
            data[key] = this.editors[key].root.innerHTML;
        });

        // Ensure honorarios is float
        if(data.valor_honorarios) data.valor_honorarios = parseFloat(data.valor_honorarios);

        return data;
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
            // Validate based on template required fields?
            // For now, keep basic validation
            if (!data.numero_processo) errors.push("Número do Processo é obrigatório.");
            if (!data.nome_autor) errors.push("Nome do Autor/Periciado é obrigatório.");

            // if (!data.cid) errors.push("Diagnóstico (CID) é obrigatório."); // Might not exist in all templates?
            // Let's check if the field exists in DOM before requiring it
            if (document.getElementById('f-cid') && !data.cid) errors.push("Diagnóstico (CID) é obrigatório.");

            if ((!data.conclusao || data.conclusao === '<p><br></p>') && document.getElementById('q-conclusao')) errors.push("Conclusão é obrigatória.");
        }

        if (data.cpf && !Validator.cpf(data.cpf)) {
            errors.push("CPF inválido.");
            const cpfEl = document.getElementById('f-cpf');
            if(cpfEl) cpfEl.classList.add('border-red-500');
        } else {
             const cpfEl = document.getElementById('f-cpf');
            if(cpfEl) cpfEl.classList.remove('border-red-500');
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
                 if (old && (old.status === 'Em Andamento' || old.status === 'Concluido')) data.status = old.status;
             }
             if (!finalize && (data.anamnese || data.exame_fisico) && data.status !== 'Concluido') {
                 data.status = 'Em Andamento';
             }
        }

        Storage.savePericia(data);
        localStorage.removeItem('pericia_draft');

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
        selector.innerHTML = '<option value="">Preencher com Modelo...</option>';
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
        const title = prompt("Nome do Template (Salva apenas os valores preenchidos):");
        if(!title) return;
        const data = this.collectFormData();
        delete data.id; delete data.numero_processo; delete data.nome_autor;
        delete data.cpf; delete data.rg; delete data.data_nascimento; delete data.documents;
        Storage.addTemplate({ title, data });
        this.populateTemplateSelector();
        alert('Modelo salvo!');
    },

    loadTemplate(id) {
        if(!id) return;
        if(!confirm("Carregar dados do modelo? Isso substituirá os campos correspondentes.")) {
            document.getElementById('template-selector').value = "";
            return;
        }
        const t = Storage.getTemplates().find(x => x.id == id);
        if(t) {
            const data = t.data;

            // Helper to set val if field exists
            const setVal = (key, val) => {
                 const el = document.getElementById(`f-${key}`);
                 if(el) {
                     if(el.tagName === 'DIV' && el.querySelector('input')) {
                          el.querySelector('input').value = val || '';
                     } else {
                          el.value = val || '';
                     }
                 }
            };

            Object.keys(data).forEach(key => {
                if(key === 'template_type') return; // Don't change type when loading content template
                setVal(key, data[key]);
            });

            // Load editors
            Object.keys(this.editors).forEach(key => {
                if(data[key]) {
                     this.editors[key].root.innerHTML = data[key];
                }
            });
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

        const fileId = pericia.documents[pericia.documents.length-1].id;
        FileDB.saveFile(fileId, dataUrl).then(() => {
            Storage.savePericia(pericia);
            this.renderDocumentsList(pericia.documents);
            document.getElementById('annotation-modal').classList.add('hidden');
        });
    }
};
