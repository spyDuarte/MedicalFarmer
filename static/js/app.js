
// --- Router & App State ---
const App = {
    editors: {}, // Quill instances
    currentPericiaId: null,
    statusChart: null,

    init() {
        this.bindEvents();
        this.route();
        this.initTheme();
        window.addEventListener('hashchange', () => this.route());
    },

    bindEvents() {
        // Global clicks for delegation if needed
    },

    initTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.getElementById('theme-icon').classList.remove('fa-moon');
            document.getElementById('theme-icon').classList.add('fa-sun');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    },

    toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.theme = 'light';
            document.getElementById('theme-icon').classList.remove('fa-sun');
            document.getElementById('theme-icon').classList.add('fa-moon');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.theme = 'dark';
            document.getElementById('theme-icon').classList.remove('fa-moon');
            document.getElementById('theme-icon').classList.add('fa-sun');
        }
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
        } else if (path === 'settings') {
            this.renderSettings();
            document.getElementById('view-settings').classList.remove('hidden');
        }
    },

    // --- Tabs Logic ---
    switchTab(tabId) {
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        // Show target
        document.getElementById(tabId).classList.remove('hidden');

        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(el => {
            el.classList.remove('active');
            el.classList.add('inactive');
        });
        document.getElementById(`btn-${tabId}`).classList.remove('inactive');
        document.getElementById(`btn-${tabId}`).classList.add('active');
    },

    // --- Views ---

    renderDashboard() {
        const pericias = Storage.getPericias();
        const tbody = document.getElementById('dashboard-table-body');
        tbody.innerHTML = '';

        let totalRecebido = 0;
        let totalPendente = 0;

        const search = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;

        const filtered = pericias.filter(p => {
             const matchesSearch = !search ||
                 (p.numero_processo && p.numero_processo.toLowerCase().includes(search)) ||
                 (p.nome_autor && p.nome_autor.toLowerCase().includes(search));
             const matchesStatus = !statusFilter || p.status === statusFilter;
             return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const stats = { 'Aguardando': 0, 'Agendado': 0, 'Em Andamento': 0, 'Concluido': 0 };

        filtered.forEach(p => {
            if (p.status_pagamento === 'Pago') totalRecebido += parseFloat(p.valor_honorarios || 0);
            else totalPendente += parseFloat(p.valor_honorarios || 0);

            if (stats[p.status] !== undefined) stats[p.status]++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    ${this.getStatusBadge(p.status)}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    <p class="text-gray-900 dark:text-gray-100 font-bold">${p.numero_processo}</p>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">${p.nome_autor}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">
                     ${p.data_pericia ? new Date(p.data_pericia + 'T00:00:00').toLocaleDateString('pt-BR') : '<span class="italic text-gray-400">Não agendado</span>'}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    <p class="font-mono text-gray-800 dark:text-gray-200">R$ ${parseFloat(p.valor_honorarios || 0).toFixed(2)}</p>
                    ${p.status_pagamento === 'Pago'
                        ? '<span class="text-xs text-green-600 dark:text-green-400"><i class="fa-solid fa-check"></i> Pago</span>'
                        : '<span class="text-xs text-yellow-600 dark:text-yellow-400"><i class="fa-solid fa-clock"></i> Pendente</span>'}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm flex gap-2">
                    <a href="#editar/${p.id}" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><i class="fa-solid fa-pen-to-square fa-lg"></i></a>
                    ${p.status === 'Concluido' ? `<a href="#print/${p.id}" target="_blank" class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"><i class="fa-solid fa-file-pdf fa-lg"></i></a>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-pendente').innerText = `R$ ${totalPendente.toFixed(2)}`;
        document.getElementById('total-recebido').innerText = `R$ ${totalRecebido.toFixed(2)}`;

        this.renderCharts(stats);
    },

    renderCharts(stats) {
        const ctx = document.getElementById('chart-status');
        if (!ctx) return;
        if (this.statusChart) this.statusChart.destroy();

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e5e7eb' : '#374151';

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Aguardando', 'Agendado', 'Em Andamento', 'Concluído'],
                datasets: [{
                    data: [stats['Aguardando'], stats['Agendado'], stats['Em Andamento'], stats['Concluido']],
                    backgroundColor: ['#facc15', '#60a5fa', '#3b82f6', '#22c55e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: textColor } }
                }
            }
        });
    },

    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        // Reset Tabs
        this.switchTab('tab-identificacao');

        // Populate inputs (Admin)
        document.getElementById('f-numero_processo').value = pericia.numero_processo || '';
        document.getElementById('f-vara').value = pericia.vara || '';
        document.getElementById('f-nome_autor').value = pericia.nome_autor || '';
        document.getElementById('f-data_nascimento').value = pericia.data_nascimento || '';
        document.getElementById('f-cpf').value = pericia.cpf || '';
        document.getElementById('f-rg').value = pericia.rg || '';
        document.getElementById('f-escolaridade').value = pericia.escolaridade || '';
        this.calcAge();

        document.getElementById('f-data_pericia').value = pericia.data_pericia ? pericia.data_pericia.split('T')[0] : '';
        document.getElementById('f-valor_honorarios').value = pericia.valor_honorarios || 0;
        document.getElementById('f-status_pagamento').value = pericia.status_pagamento || 'Pendente';

        // History
        document.getElementById('f-profissao').value = pericia.profissao || '';
        document.getElementById('f-tempo_funcao').value = pericia.tempo_funcao || '';
        document.getElementById('f-desc_atividades').value = pericia.desc_atividades || '';
        document.getElementById('f-antecedentes').value = pericia.antecedentes || '';

        // Clinical & Exams
        document.getElementById('f-exames_complementares').value = pericia.exames_complementares || '';

        // Conclusion
        document.getElementById('f-discussao').value = pericia.discussao || '';
        document.getElementById('f-cid').value = pericia.cid || '';
        document.getElementById('f-nexo').value = pericia.nexo || 'Não há nexo';
        document.getElementById('f-did').value = pericia.did || '';
        document.getElementById('f-dii').value = pericia.dii || '';
        document.getElementById('f-parecer').value = pericia.parecer || 'Capto';

        // Initialize Quill and Documents List (Always active now, controlled by tabs)
        this.initQuill(pericia);
        this.renderDocumentsList(pericia.documents || []);
    },

    renderSettings() {
        const s = Storage.getSettings();
        document.getElementById('s-nome').value = s.nome || '';
        document.getElementById('s-crm').value = s.crm || '';
        document.getElementById('s-endereco').value = s.endereco || '';
        document.getElementById('s-telefone').value = s.telefone || '';
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
            div.className = "bg-white dark:bg-gray-800 shadow border-l-4 border-blue-500 rounded p-4 flex justify-between items-start mb-4";
            div.innerHTML = `
                <div>
                     <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-blue-600 bg-blue-200">
                            ${m.categoria.replace('_', ' ')}
                        </span>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${m.titulo}</h3>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line mt-2">${m.conteudo}</p>
                </div>
                <button onclick="App.deleteMacro(${m.id})" class="text-red-500 hover:text-red-700 ml-4"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(div);
        });
    },

    renderPrint(id) {
        const pericia = Storage.getPericia(id);
        const s = Storage.getSettings();
        if(!pericia) return;

        // Header
        document.getElementById('print-header-name').innerText = s.nome || 'Dr. Perito Judicial';
        document.getElementById('print-header-crm').innerText = s.crm || 'CRM-XX 00000';
        document.getElementById('print-header-contact').innerText = `${s.endereco ? s.endereco : ''} ${s.telefone ? ' | ' + s.telefone : ''}`;

        document.getElementById('p-processo').innerText = pericia.numero_processo;
        document.getElementById('p-data').innerText = pericia.data_pericia ? new Date(pericia.data_pericia + 'T00:00:00').toLocaleDateString('pt-BR') : '___/___/____';

        // 1. Identificação Detalhada
        let idDetails = `
            <strong>Nome:</strong> ${pericia.nome_autor}<br>
            <strong>Nascimento:</strong> ${pericia.data_nascimento ? new Date(pericia.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
            (${this.calculateAgeValue(pericia.data_nascimento) || '-'} anos)<br>
            <strong>RG:</strong> ${pericia.rg || '-'} | <strong>CPF:</strong> ${pericia.cpf || '-'}<br>
            <strong>Escolaridade:</strong> ${pericia.escolaridade || '-'}
        `;
        document.getElementById('p-identificacao-detalhada').innerHTML = idDetails;

        // 2. Histórico
        let histOcup = `
            <strong>Profissão:</strong> ${pericia.profissao || '-'}<br>
            <strong>Tempo na Função:</strong> ${pericia.tempo_funcao || '-'}<br>
            <strong>Atividades/Riscos:</strong> ${pericia.desc_atividades || '-'}
        `;
        document.getElementById('p-ocupacional').innerHTML = histOcup;
        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        document.getElementById('p-antecedentes').innerText = pericia.antecedentes || 'Nada digno de nota.';

        // 3. Exame
        document.getElementById('p-exame').innerHTML = pericia.exame_fisico || 'Não informado.';

        // 4. Documentos
        document.getElementById('p-exames-comp').innerText = pericia.exames_complementares || 'Não apresentados.';

        // 5. Conclusão
        document.getElementById('p-discussao').innerText = pericia.discussao || '';
        document.getElementById('p-cid').innerText = pericia.cid || '-';
        document.getElementById('p-nexo').innerText = pericia.nexo || '-';
        document.getElementById('p-did').innerText = pericia.did || '-';
        document.getElementById('p-dii').innerText = pericia.dii || '-';
        document.getElementById('p-parecer').innerText = pericia.parecer || '-';
        document.getElementById('p-conclusao').innerHTML = pericia.conclusao || '';

        // 6. Quesitos
        document.getElementById('p-quesitos').innerHTML = pericia.quesitos || 'Vide corpo do laudo.';

        // Footer
        document.getElementById('print-footer-name').innerText = s.nome || 'Dr. Perito Judicial';
        document.getElementById('print-footer-crm').innerText = s.crm || 'CRM-XX 00000';
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

    calcAge() {
        const dobStr = document.getElementById('f-data_nascimento').value;
        const display = document.getElementById('f-idade-display');
        if(dobStr) {
            const age = this.calculateAgeValue(dobStr);
            display.innerText = `${age} anos`;
        } else {
            display.innerText = '';
        }
    },

    calculateAgeValue(dobStr) {
        if(!dobStr) return null;
        const dob = new Date(dobStr);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
    },

    initQuill(pericia) {
        const opts = { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['clean']] } };

        // Destroy old if exists
        document.querySelectorAll('.ql-toolbar').forEach(e => e.remove());

        // Main Editors
        this.editors['anamnese'] = new Quill('#q-anamnese', opts);
        this.editors['exame_fisico'] = new Quill('#q-exame_fisico', opts);
        this.editors['conclusao'] = new Quill('#q-conclusao', opts);

        // New Editor for Quesitos
        this.editors['quesitos'] = new Quill('#q-quesitos', opts);

        // Set Content
        this.editors['anamnese'].root.innerHTML = pericia.anamnese || '';
        this.editors['exame_fisico'].root.innerHTML = pericia.exame_fisico || '';
        this.editors['conclusao'].root.innerHTML = pericia.conclusao || '';
        this.editors['quesitos'].root.innerHTML = pericia.quesitos || '';

        // Init Macro Selects
        this.populateMacroSelects();
    },

    populateMacroSelects() {
        const macros = Storage.getMacros();
        // Updated categories list? Ideally add macros for quesitos too, but sticking to existing
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

    // --- Actions ---

    saveForm(finalize = false) {
        const data = {
            id: this.currentPericiaId,
            numero_processo: document.getElementById('f-numero_processo').value,
            vara: document.getElementById('f-vara').value,
            nome_autor: document.getElementById('f-nome_autor').value,

            // Extended Data
            data_nascimento: document.getElementById('f-data_nascimento').value,
            cpf: document.getElementById('f-cpf').value,
            rg: document.getElementById('f-rg').value,
            escolaridade: document.getElementById('f-escolaridade').value,

            // History
            profissao: document.getElementById('f-profissao').value,
            tempo_funcao: document.getElementById('f-tempo_funcao').value,
            desc_atividades: document.getElementById('f-desc_atividades').value,
            antecedentes: document.getElementById('f-antecedentes').value,

            // Exams & Conclusion
            exames_complementares: document.getElementById('f-exames_complementares').value,
            discussao: document.getElementById('f-discussao').value,
            cid: document.getElementById('f-cid').value,
            nexo: document.getElementById('f-nexo').value,
            did: document.getElementById('f-did').value,
            dii: document.getElementById('f-dii').value,
            parecer: document.getElementById('f-parecer').value,

            data_pericia: document.getElementById('f-data_pericia').value,
            valor_honorarios: parseFloat(document.getElementById('f-valor_honorarios').value),
            status_pagamento: document.getElementById('f-status_pagamento').value,

            // Rich Text
            anamnese: this.editors['anamnese'] ? this.editors['anamnese'].root.innerHTML : '',
            exame_fisico: this.editors['exame_fisico'] ? this.editors['exame_fisico'].root.innerHTML : '',
            conclusao: this.editors['conclusao'] ? this.editors['conclusao'].root.innerHTML : '',
            quesitos: this.editors['quesitos'] ? this.editors['quesitos'].root.innerHTML : '',

            documents: this.currentPericiaId ? (Storage.getPericia(this.currentPericiaId).documents || []) : []
        };

        // Determine Status
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

        const saved = Storage.savePericia(data);
        window.location.hash = '#dashboard';
    },

    saveSettings() {
        const settings = {
            nome: document.getElementById('s-nome').value,
            crm: document.getElementById('s-crm').value,
            endereco: document.getElementById('s-endereco').value,
            telefone: document.getElementById('s-telefone').value
        };
        Storage.saveSettings(settings);
        alert('Configurações salvas!');
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
                content: e.target.result
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
            li.className = "flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 text-sm mb-1";
            li.innerHTML = `
                <a href="#" onclick="App.downloadFile(${doc.id})" class="text-blue-600 dark:text-blue-400 truncate hover:underline">${doc.original_name}</a>
                <button onclick="App.deleteFile(${doc.id})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
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
