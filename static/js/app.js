
// --- Router & App State ---
const App = {
    editors: {}, // Quill instances
    currentPericiaId: null,

    init() {
        this.bindEvents();
        this.route();
        window.addEventListener('hashchange', () => this.route());
    },

    bindEvents() {
        // Global clicks for delegation if needed
    },

    route() {
        const hash = window.location.hash || '#dashboard';
        const [path, id] = hash.substring(1).split('/');

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        if (path === 'dashboard') {
            this.renderDashboard();
            document.getElementById('view-dashboard').classList.remove('hidden');
        } else if (path === 'nova') {
            this.renderForm(null);
            document.getElementById('view-form').classList.remove('hidden');
        } else if (path === 'editar') {
            this.renderForm(id);
            document.getElementById('view-form').classList.remove('hidden');
        } else if (path === 'macros') {
            this.renderMacros();
            document.getElementById('view-macros').classList.remove('hidden');
        } else if (path === 'print') {
            this.renderPrint(id);
            document.getElementById('view-print').classList.remove('hidden');
        }
    },

    // --- Views ---

    renderDashboard() {
        const pericias = Storage.getPericias();
        const tbody = document.getElementById('dashboard-table-body');
        tbody.innerHTML = '';

        // Financials
        let totalRecebido = 0;
        let totalPendente = 0;

        // Filtering
        const search = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;

        const filtered = pericias.filter(p => {
             const matchesSearch = !search ||
                 (p.numero_processo && p.numero_processo.toLowerCase().includes(search)) ||
                 (p.nome_autor && p.nome_autor.toLowerCase().includes(search));
             const matchesStatus = !statusFilter || p.status === statusFilter;
             return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        filtered.forEach(p => {
            if (p.status_pagamento === 'Pago') totalRecebido += parseFloat(p.valor_honorarios || 0);
            else totalPendente += parseFloat(p.valor_honorarios || 0);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${this.getStatusBadge(p.status)}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p class="text-gray-900 font-bold">${p.numero_processo}</p>
                    <p class="text-gray-600 text-xs">${p.nome_autor}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                     ${p.data_pericia ? new Date(p.data_pericia).toLocaleDateString('pt-BR') : '<span class="italic text-gray-400">Não agendado</span>'}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p class="font-mono">R$ ${parseFloat(p.valor_honorarios || 0).toFixed(2)}</p>
                    ${p.status_pagamento === 'Pago'
                        ? '<span class="text-xs text-green-600"><i class="fa-solid fa-check"></i> Pago</span>'
                        : '<span class="text-xs text-yellow-600"><i class="fa-solid fa-clock"></i> Pendente</span>'}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm flex gap-2">
                    <a href="#editar/${p.id}" class="text-blue-600 hover:text-blue-900"><i class="fa-solid fa-pen-to-square fa-lg"></i></a>
                    ${p.status === 'Concluido' ? `<a href="#print/${p.id}" target="_blank" class="text-green-600 hover:text-green-900"><i class="fa-solid fa-file-pdf fa-lg"></i></a>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-pendente').innerText = `R$ ${totalPendente.toFixed(2)}`;
        document.getElementById('total-recebido').innerText = `R$ ${totalRecebido.toFixed(2)}`;
    },

    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Populate inputs
        document.getElementById('f-numero_processo').value = pericia.numero_processo || '';
        document.getElementById('f-nome_autor').value = pericia.nome_autor || '';
        document.getElementById('f-data_pericia').value = pericia.data_pericia ? pericia.data_pericia.split('T')[0] : ''; // Simple handling
        document.getElementById('f-valor_honorarios').value = pericia.valor_honorarios || 0;
        document.getElementById('f-status_pagamento').value = pericia.status_pagamento || 'Pendente';

        // Clinical Section Visibility
        const clinicalSection = document.getElementById('clinical-section');
        const documentsSection = document.getElementById('documents-section');

        if (id) {
            clinicalSection.classList.remove('hidden');
            documentsSection.classList.remove('hidden');
            this.initQuill(pericia);
            this.renderDocumentsList(pericia.documents || []);
        } else {
            clinicalSection.classList.add('hidden');
            documentsSection.classList.add('hidden');
        }
    },

    renderMacros() {
        const macros = Storage.getMacros();
        const container = document.getElementById('macros-list');
        container.innerHTML = '';

        if (macros.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center p-4">Nenhum modelo cadastrado.</p>';
            return;
        }

        macros.forEach(m => {
            const div = document.createElement('div');
            div.className = "bg-white shadow border-l-4 border-blue-500 rounded p-4 flex justify-between items-start mb-4";
            div.innerHTML = `
                <div>
                     <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-blue-600 bg-blue-200">
                            ${m.categoria.replace('_', ' ')}
                        </span>
                        <h3 class="text-lg font-bold">${m.titulo}</h3>
                    </div>
                    <p class="text-gray-600 text-sm whitespace-pre-line mt-2">${m.conteudo}</p>
                </div>
                <button onclick="App.deleteMacro(${m.id})" class="text-red-500 hover:text-red-700 ml-4"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(div);
        });
    },

    renderPrint(id) {
        const pericia = Storage.getPericia(id);
        if(!pericia) return;

        document.getElementById('p-processo').innerText = pericia.numero_processo;
        document.getElementById('p-data').innerText = pericia.data_pericia ? new Date(pericia.data_pericia).toLocaleDateString('pt-BR') : '___/___/____';
        document.getElementById('p-autor').innerText = pericia.nome_autor;
        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        document.getElementById('p-exame').innerHTML = pericia.exame_fisico || 'Não informado.';
        document.getElementById('p-conclusao').innerHTML = pericia.conclusao || 'Não informado.';
    },

    // --- Helpers ---

    getStatusBadge(status) {
        const classes = {
            'Aguardando': 'bg-yellow-200 text-yellow-900',
            'Agendado': 'bg-blue-100 text-blue-900',
            'Em Andamento': 'bg-blue-200 text-blue-900',
            'Concluido': 'bg-green-200 text-green-900'
        };
        const cls = classes[status] || 'bg-gray-200 text-gray-900';
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${status}</span>`;
    },

    initQuill(pericia) {
        const opts = { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['clean']] } };

        // Destroy old if exists to avoid dupes
        document.querySelectorAll('.ql-toolbar').forEach(e => e.remove());

        this.editors['anamnese'] = new Quill('#q-anamnese', opts);
        this.editors['exame_fisico'] = new Quill('#q-exame_fisico', opts);
        this.editors['conclusao'] = new Quill('#q-conclusao', opts);

        // Set Content
        this.editors['anamnese'].root.innerHTML = pericia.anamnese || '';
        this.editors['exame_fisico'].root.innerHTML = pericia.exame_fisico || '';
        this.editors['conclusao'].root.innerHTML = pericia.conclusao || '';

        // Init Macro Selects
        this.populateMacroSelects();
    },

    populateMacroSelects() {
        const macros = Storage.getMacros();
        ['anamnese', 'exame_fisico', 'conclusao'].forEach(cat => {
            const sel = document.getElementById(`macro-sel-${cat}`);
            sel.innerHTML = '<option value="">Inserir modelo...</option>';
            macros.filter(m => m.categoria === cat).forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.innerText = m.titulo;
                sel.appendChild(opt);
            });

            // Remove old listener
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

    // --- Actions ---

    saveForm(finalize = false) {
        const data = {
            id: this.currentPericiaId,
            numero_processo: document.getElementById('f-numero_processo').value,
            nome_autor: document.getElementById('f-nome_autor').value,
            data_pericia: document.getElementById('f-data_pericia').value,
            valor_honorarios: parseFloat(document.getElementById('f-valor_honorarios').value),
            status_pagamento: document.getElementById('f-status_pagamento').value,

            anamnese: this.editors['anamnese'] ? this.editors['anamnese'].root.innerHTML : '',
            exame_fisico: this.editors['exame_fisico'] ? this.editors['exame_fisico'].root.innerHTML : '',
            conclusao: this.editors['conclusao'] ? this.editors['conclusao'].root.innerHTML : '',

            documents: this.currentPericiaId ? (Storage.getPericia(this.currentPericiaId).documents || []) : []
        };

        // Determine Status
        if (finalize) data.status = 'Concluido';
        else if (!data.status) {
             // Logic for new/update
             if (data.data_pericia) data.status = 'Agendado';
             else data.status = 'Aguardando';

             // If existing was In Progress, keep it unless finalized
             if (this.currentPericiaId) {
                 const old = Storage.getPericia(this.currentPericiaId);
                 if (old.status === 'Em Andamento' || old.status === 'Concluido') data.status = old.status;
             }
             if (!finalize && (data.anamnese || data.exame_fisico) && data.status !== 'Concluido') {
                 data.status = 'Em Andamento';
             }
        }

        const saved = Storage.savePericia(data);
        window.location.hash = '#dashboard';
    },

    saveMacro() {
        const title = document.getElementById('m-titulo').value;
        const cat = document.getElementById('m-categoria').value;
        const content = document.getElementById('m-conteudo').value;

        if(title && content) {
            Storage.addMacro({titulo: title, categoria: cat, conteudo: content});
            document.getElementById('m-titulo').value = '';
            document.getElementById('m-conteudo').value = '';
            this.renderMacros();
        }
    },

    deleteMacro(id) {
        if(confirm('Excluir modelo?')) {
            Storage.deleteMacro(id);
            this.renderMacros();
        }
    },

    // --- Files ---

    handleFileUpload() {
        const input = document.getElementById('upload_document');
        const file = input.files[0];
        if(!file || !this.currentPericiaId) return;

        // Limit size for LocalStorage (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("Arquivo muito grande para versão Web. Máximo 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const pericia = Storage.getPericia(this.currentPericiaId);
            if(!pericia.documents) pericia.documents = [];

            pericia.documents.push({
                id: Date.now(),
                original_name: file.name,
                content: e.target.result // Data URL
            });

            Storage.savePericia(pericia);
            this.renderDocumentsList(pericia.documents);
            input.value = "";
        };
        reader.readAsDataURL(file);
    },

    renderDocumentsList(docs) {
        const ul = document.getElementById('documents-list-ul');
        ul.innerHTML = '';
        if(docs.length === 0) {
            ul.innerHTML = '<li class="text-gray-400 text-sm italic">Nenhum documento.</li>';
            return;
        }
        docs.forEach(doc => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm mb-1";
            li.innerHTML = `
                <a href="#" onclick="App.downloadFile(${doc.id})" class="text-blue-600 truncate hover:underline">${doc.original_name}</a>
                <button onclick="App.deleteFile(${doc.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
            `;
            ul.appendChild(li);
        });
    },

    downloadFile(docId) {
        const pericia = Storage.getPericia(this.currentPericiaId);
        const doc = pericia.documents.find(d => d.id == docId);
        if(doc) {
            const a = document.createElement('a');
            a.href = doc.content;
            a.download = doc.original_name;
            a.click();
        }
    },

    deleteFile(docId) {
        if(!confirm("Excluir?")) return;
        const pericia = Storage.getPericia(this.currentPericiaId);
        pericia.documents = pericia.documents.filter(d => d.id != docId);
        Storage.savePericia(pericia);
        this.renderDocumentsList(pericia.documents);
    }
};

window.onload = () => App.init();
