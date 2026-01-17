
// --- Router & App State ---
const App = {
    editors: {}, // Quill instances
    currentPericiaId: null,
    statusChart: null,
    autoSaveTimeout: null,

    // Annotation State
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentTool: 'pen',
    currentImage: null,
    originalDocId: null,

    init() {
        this.bindEvents();
        this.route();
        this.initTheme();
        window.addEventListener('hashchange', () => this.route());
    },

    bindEvents() {
        // Global shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                // Only save if in editing view
                if (!document.getElementById('view-form').classList.contains('hidden')) {
                    this.saveForm();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                // If in print view, trigger print. Else if in dashboard... maybe nothing
                if (!document.getElementById('view-print').classList.contains('hidden')) {
                    window.print();
                }
            }
        });
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
        } else if (path === 'calendar') {
            document.getElementById('view-calendar').classList.remove('hidden');
            this.renderCalendar();
        }
    },

    // --- Tabs Logic ---
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

    // --- Views ---

    // --- Calendar ---
    renderCalendar: function() {
        if (!this.calendar) {
            const calendarEl = document.getElementById('calendar-container');
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'pt-br',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                buttonText: {
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista'
                },
                events: function(fetchInfo, successCallback, failureCallback) {
                    const history = Storage.getPericias();
                    const events = history
                        .filter(item => item.data_pericia) // Only items with a date
                        .map(item => ({
                            title: item.nome_autor || 'Sem Nome',
                            start: item.data_pericia,
                            url: '#editar/' + item.id,
                            color: item.status === 'Concluido' ? '#10B981' : (item.status === 'Agendado' ? '#3B82F6' : '#F59E0B')
                        }));
                    successCallback(events);
                },
                eventClick: function(info) {
                    info.jsEvent.preventDefault(); // don't let the browser navigate
                    if (info.event.url) {
                        window.location.hash = info.event.url;
                    }
                }
            });
            this.calendar.render();
        } else {
            this.calendar.refetchEvents(); // Refresh data
            this.calendar.render(); // Ensure proper sizing
        }
    },

    // --- PDF Export ---
    exportPDF: function() {
        const element = document.getElementById('view-print');

        // Options for html2pdf
        const opt = {
          margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
          filename:     `Laudo_${new Date().toISOString().slice(0,10)}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true }, // Higher scale for better quality
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Hide buttons during generation
        const btnContainer = element.querySelector('.fixed.bottom-4.right-4');
        if(btnContainer) btnContainer.style.display = 'none';

        html2pdf().set(opt).from(element).save().then(() => {
             // Restore buttons
             if(btnContainer) btnContainer.style.display = 'flex';
        }).catch(err => {
            console.error(err);
            alert("Erro ao gerar PDF: " + err.message);
            if(btnContainer) btnContainer.style.display = 'flex';
        });
    },

    renderDashboard() {
        const pericias = Storage.getPericias();
        const tbody = document.getElementById('dashboard-table-body');
        tbody.innerHTML = '';

        let totalRecebido = 0;
        let totalPendente = 0;

        const search = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;
        const dateStart = document.getElementById('date-start').value;
        const dateEnd = document.getElementById('date-end').value;

        const filtered = pericias.filter(p => {
             const matchesSearch = !search ||
                 (p.numero_processo && p.numero_processo.toLowerCase().includes(search)) ||
                 (p.nome_autor && p.nome_autor.toLowerCase().includes(search));

             const matchesStatus = !statusFilter || p.status === statusFilter;

             let matchesDate = true;
             if (dateStart || dateEnd) {
                 const pDate = p.data_pericia ? new Date(p.data_pericia) : null;
                 if (!pDate) matchesDate = false;
                 else {
                     if (dateStart && pDate < new Date(dateStart)) matchesDate = false;
                     if (dateEnd && pDate > new Date(dateEnd)) matchesDate = false;
                 }
             }

             return matchesSearch && matchesStatus && matchesDate;
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

    // --- UI Components (Toast, Modal, Loading) ---
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

        toast.className = `flex items-center gap-2 px-4 py-3 rounded shadow-lg text-white ${bgColor} toast-enter pointer-events-auto`;
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span class="text-sm font-medium">${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    },

    showModal(title, message, onConfirm) {
        const modal = document.getElementById('custom-modal');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerText = message;

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        // Clone buttons to strip old listeners
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);

        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newConfirm.onclick = () => {
            onConfirm();
            modal.classList.add('hidden');
        };

        newCancel.onclick = () => {
            modal.classList.add('hidden');
        };

        modal.classList.remove('hidden');
    },

    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        if (show) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    },

    // --- Data Collection Helper ---
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

    renderForm(id) {
        this.currentPericiaId = id;
        const pericia = id ? Storage.getPericia(id) : {};

        this.switchTab('tab-identificacao');
        this.populateTemplateSelector(); // Refresh template list

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
            newEl.value = el.value; // Restore dynamic value lost by cloneNode
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
        });
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

    renderSettings() {
        const s = Storage.getSettings();
        document.getElementById('s-nome').value = s.nome || '';
        document.getElementById('s-crm').value = s.crm || '';
        document.getElementById('s-endereco').value = s.endereco || '';
        document.getElementById('s-telefone').value = s.telefone || '';

        // Add Listeners to Settings
        document.querySelectorAll('#view-settings input').forEach(el => {
            const newEl = el.cloneNode(true);
            newEl.value = el.value; // Restore dynamic value
            el.parentNode.replaceChild(newEl, el);

            if(newEl.id === 's-telefone') {
                newEl.addEventListener('input', (e) => e.target.value = Mask.phone(e.target.value));
            }
        });

        // Render existing signature preview if available
        const sigPreview = document.getElementById('signature-preview');
        if(sigPreview) sigPreview.remove(); // clear old

        if (s.signature) {
            const img = document.createElement('img');
            img.src = s.signature;
            img.id = 'signature-preview';
            img.className = 'mt-4 border rounded max-h-24';
            document.querySelector('#view-settings .max-w-2xl').appendChild(img);
        }
    },

    openSignatureModal() {
        const modal = document.getElementById('signature-modal');
        const canvas = document.getElementById('signature-canvas');
        this.sigCanvas = canvas;
        this.sigCtx = canvas.getContext('2d');

        // Reset canvas
        this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
        this.sigCtx.lineWidth = 2;
        this.sigCtx.strokeStyle = '#000';

        // Events
        let drawing = false;
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        canvas.onmousedown = (e) => { drawing = true; this.sigCtx.beginPath(); this.sigCtx.moveTo(getPos(e).x, getPos(e).y); };
        canvas.onmousemove = (e) => { if(drawing) { this.sigCtx.lineTo(getPos(e).x, getPos(e).y); this.sigCtx.stroke(); } };
        canvas.onmouseup = () => { drawing = false; };

        modal.classList.remove('hidden');
    },

    clearSignature() {
        this.sigCtx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
    },

    saveSignature() {
        const dataUrl = this.sigCanvas.toDataURL('image/png');
        const s = Storage.getSettings();
        s.signature = dataUrl;
        Storage.saveSettings(s);
        document.getElementById('signature-modal').classList.add('hidden');
        this.renderSettings(); // Re-render to show preview
        this.showToast('Assinatura salva!', 'success');
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

        let idDetails = `
            <strong>Nome:</strong> ${pericia.nome_autor}<br>
            <strong>Nascimento:</strong> ${pericia.data_nascimento ? new Date(pericia.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
            (${this.calculateAgeValue(pericia.data_nascimento) || '-'} anos)<br>
            <strong>RG:</strong> ${pericia.rg || '-'} | <strong>CPF:</strong> ${pericia.cpf || '-'}<br>
            <strong>Escolaridade:</strong> ${pericia.escolaridade || '-'}
        `;
        document.getElementById('p-identificacao-detalhada').innerHTML = idDetails;

        let histOcup = `
            <strong>Profissão:</strong> ${pericia.profissao || '-'}<br>
            <strong>Tempo na Função:</strong> ${pericia.tempo_funcao || '-'}<br>
            <strong>Atividades/Riscos:</strong> ${pericia.desc_atividades || '-'}
        `;
        document.getElementById('p-ocupacional').innerHTML = histOcup;
        document.getElementById('p-anamnese').innerHTML = pericia.anamnese || 'Não informado.';
        document.getElementById('p-antecedentes').innerText = pericia.antecedentes || 'Nada digno de nota.';

        document.getElementById('p-exame').innerHTML = pericia.exame_fisico || 'Não informado.';

        document.getElementById('p-exames-comp').innerText = pericia.exames_complementares || 'Não apresentados.';

        document.getElementById('p-discussao').innerText = pericia.discussao || '';
        document.getElementById('p-cid').innerText = pericia.cid || '-';
        document.getElementById('p-nexo').innerText = pericia.nexo || '-';
        document.getElementById('p-did').innerText = pericia.did || '-';
        document.getElementById('p-dii').innerText = pericia.dii || '-';
        document.getElementById('p-parecer').innerText = pericia.parecer || '-';
        document.getElementById('p-conclusao').innerHTML = pericia.conclusao || '';

        document.getElementById('p-quesitos').innerHTML = pericia.quesitos || 'Vide corpo do laudo.';

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
        // Custom Toolbar with Mic
        const toolbarOptions = [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ];

        const opts = { theme: 'snow', modules: { toolbar: toolbarOptions } };

        document.querySelectorAll('.ql-toolbar').forEach(e => e.remove());

        // Helper to add Mic button
        const addMic = (quill, id) => {
            const container = quill.getModule('toolbar').container;
            const btn = document.createElement('button');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            btn.classList.add('ql-mic');
            btn.title = "Ditado de Voz";
            btn.onclick = (e) => {
                e.preventDefault();
                this.toggleSpeech(quill, btn);
            };
            container.appendChild(btn);
        };

        this.editors['anamnese'] = new Quill('#q-anamnese', opts);
        addMic(this.editors['anamnese'], 'anamnese');

        this.editors['exame_fisico'] = new Quill('#q-exame_fisico', opts);
        addMic(this.editors['exame_fisico'], 'exame_fisico');

        this.editors['conclusao'] = new Quill('#q-conclusao', opts);
        addMic(this.editors['conclusao'], 'conclusao');

        this.editors['quesitos'] = new Quill('#q-quesitos', opts);
        addMic(this.editors['quesitos'], 'quesitos');

        this.editors['anamnese'].root.innerHTML = pericia.anamnese || '';
        this.editors['exame_fisico'].root.innerHTML = pericia.exame_fisico || '';
        this.editors['conclusao'].root.innerHTML = pericia.conclusao || '';
        this.editors['quesitos'].root.innerHTML = pericia.quesitos || '';

        Object.values(this.editors).forEach(editor => {
            editor.on('text-change', () => this.autoSave());
        });

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

    // Auto-Save Implementation
    autoSave() {
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const data = this.collectFormData();
            // Don't auto-save if we are editing an existing finalized one?
            // Or just save to draft key regardless.
            localStorage.setItem('pericia_draft', JSON.stringify(data));
            // Optional: minimal feedback toast
            // this.showToast('Rascunho salvo', 'info');
        }, 2000);
    },

    saveForm(finalize = false) {
        const data = this.collectFormData();

        // Validation
        let errors = [];

        if (finalize) {
            // Mandatory fields for finalization
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
            this.showModal("Atenção", "Corrija os erros antes de continuar:\n" + errors.join('\n'), () => {});
            // Hide cancel button for alert-style modal
            document.getElementById('modal-cancel').classList.add('hidden');
            // Restore functionality of confirm button to just close
            const btn = document.getElementById('modal-confirm');
            btn.innerText = "OK";
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = () => {
                document.getElementById('custom-modal').classList.add('hidden');
                document.getElementById('modal-cancel').classList.remove('hidden'); // Reset
                newBtn.innerText = "Confirmar";
            };
            return;
        }

        const proceedSave = () => {
            this.showLoading(true);
            setTimeout(() => { // Simulate delay for UX
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
                this.showLoading(false);
                this.showToast(finalize ? 'Perícia finalizada com sucesso!' : 'Rascunho salvo com sucesso!', 'success');
                window.location.hash = '#dashboard';
            }, 500);
        };

        if (finalize) {
            this.showModal('Finalizar Perícia', 'Deseja realmente finalizar? O status será alterado para Concluído.', proceedSave);
        } else {
            proceedSave();
        }
    },

    saveSettings() {
        const settings = {
            nome: document.getElementById('s-nome').value,
            crm: document.getElementById('s-crm').value,
            endereco: document.getElementById('s-endereco').value,
            telefone: document.getElementById('s-telefone').value
        };
        Storage.saveSettings(settings);
        this.showToast('Configurações salvas!', 'success');
    },

    // --- Templates ---
    saveAsTemplate() {
        const title = prompt("Nome do Template:");
        if(!title) return;

        const data = this.collectFormData();
        // Remove IDs and specific fields
        delete data.id;
        delete data.numero_processo;
        delete data.nome_autor;
        delete data.cpf;
        delete data.rg;
        delete data.data_nascimento;
        delete data.documents;

        const template = { title, data };
        Storage.addTemplate(template);
        this.populateTemplateSelector();
        this.showToast('Template salvo!', 'success');
    },

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
    },

    loadTemplate(templateId) {
        if(!templateId) return;
        if(!confirm("Carregar template? Isso substituirá os dados atuais.")) {
            document.getElementById('template-selector').value = "";
            return;
        }

        const templates = Storage.getTemplates();
        const template = templates.find(t => t.id == templateId);
        if(template) {
            // Populate fields similar to renderForm but skipping ID-bound logic
            const data = template.data;
            Object.keys(data).forEach(key => {
                const el = document.getElementById(`f-${key}`);
                if(el) el.value = data[key] || '';
            });
            // Rich text
            this.editors['anamnese'].root.innerHTML = data.anamnese || '';
            this.editors['exame_fisico'].root.innerHTML = data.exame_fisico || '';
            this.editors['conclusao'].root.innerHTML = data.conclusao || '';
            this.editors['quesitos'].root.innerHTML = data.quesitos || '';

            this.showToast('Template carregado!', 'success');
        }
        document.getElementById('template-selector').value = "";
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
            this.showToast('Modelo adicionado!', 'success');
        } else {
            this.showToast('Preencha todos os campos.', 'error');
        }
    },

    deleteMacro(id) {
        this.showModal('Excluir Modelo', 'Tem certeza que deseja excluir este modelo?', () => {
            Storage.deleteMacro(id);
            this.renderMacros();
            this.showToast('Modelo removido.', 'info');
        });
    },

    // --- Files (IndexedDB) ---

    handleFileUpload() {
        const input = document.getElementById('upload_document');
        const file = input.files[0];
        if(!file || !this.currentPericiaId) {
            this.showToast('Selecione um arquivo e salve a perícia antes.', 'error');
            return;
        }

        // Compress image before saving if it's an image
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

                // Max dimensions
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

                // Compress to JPEG 0.7 quality
                canvas.toBlob((blob) => {
                    callback(blob);
                }, 'image/jpeg', 0.7);
            };
        };
    },

    _saveFileToDB(blob, originalName) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result; // Base64 for IndexedDB simplicity with current structure
            const fileId = Date.now();

            try {
                await FileDB.saveFile(fileId, content);

                const pericia = Storage.getPericia(this.currentPericiaId);
                if(!pericia.documents) pericia.documents = [];

                // Store reference in LocalStorage
                pericia.documents.push({
                    id: fileId,
                    original_name: originalName,
                    // content: null // Don't store content in LS
                });

                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
                document.getElementById('upload_document').value = "";
                this.showToast('Documento salvo!', 'success');
            } catch (err) {
                console.error(err);
                this.showToast('Erro ao salvar arquivo.', 'error');
            }
        };
        reader.readAsDataURL(blob);
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

            const isImage = doc.original_name.match(/\.(jpg|jpeg|png|webp)$/i);

            li.innerHTML = `
                <div class="flex items-center gap-2 truncate">
                    <a href="#" onclick="App.downloadFile(${doc.id}, '${doc.original_name}')" class="text-blue-600 dark:text-blue-400 hover:underline truncate">${doc.original_name}</a>
                    ${isImage ? `<button onclick="App.openAnnotation(${doc.id})" class="text-gray-500 hover:text-blue-500" title="Anotar"><i class="fa-solid fa-paintbrush"></i></button>` : ''}
                </div>
                <button onclick="App.deleteFile(${doc.id})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
            `;
            ul.appendChild(li);
        });
    },

    async downloadFile(docId, name) {
        try {
            const content = await FileDB.getFile(docId);
            if(content) {
                const a = document.createElement('a');
                a.href = content;
                a.download = name;
                a.click();
            } else {
                this.showToast('Arquivo não encontrado.', 'error');
            }
        } catch (e) {
            console.error(e);
            this.showToast('Erro ao abrir arquivo.', 'error');
        }
    },

    deleteFile(docId) {
        this.showModal('Excluir Documento', 'Tem certeza que deseja excluir este documento?', async () => {
            try {
                await FileDB.deleteFile(docId);
                const pericia = Storage.getPericia(this.currentPericiaId);
                pericia.documents = pericia.documents.filter(d => d.id != docId);
                Storage.savePericia(pericia);
                this.renderDocumentsList(pericia.documents);
                this.showToast('Documento removido.', 'info');
            } catch (e) {
                console.error(e);
                this.showToast('Erro ao excluir.', 'error');
            }
        });
    },

    // --- Speech to Text ---
    toggleSpeech(quill, btn) {
        if (!('webkitSpeechRecognition' in window)) {
            this.showToast("Navegador não suporta reconhecimento de voz.", "error");
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
            this.showToast("Gravando... Fale agora.", "info");
        };

        this.recognition.onend = () => {
            this.recognition.started = false;
            btn.classList.remove('text-red-600', 'animate-pulse');
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript + ' ';
                }
            }
            if (transcript) {
                const range = quill.getSelection(true);
                quill.insertText(range.index, transcript);
            }
        };

        this.recognition.start();
    },

    // --- Annotation Tool ---
    async openAnnotation(docId) {
        this.originalDocId = docId;
        const pericia = Storage.getPericia(this.currentPericiaId);
        // We get ID from doc list, content from DB
        const content = await FileDB.getFile(docId);

        if (!content) {
            this.showToast('Erro ao carregar imagem.', 'error');
            return;
        }

        const modal = document.getElementById('annotation-modal');
        const canvas = document.getElementById('annotation-canvas');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Load Image
        const img = new Image();
        img.onload = () => {
            // Resize logic
            const container = canvas.parentElement;
            const aspect = img.width / img.height;

            // Fit to container (max 800x600 for example, or based on container size)
            let width = container.clientWidth;
            let height = width / aspect;

            if (height > container.clientHeight) {
                height = container.clientHeight;
                width = height * aspect;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image
            this.ctx.drawImage(img, 0, 0, width, height);
            this.currentImage = img; // Keep ref for redrawing if needed

            modal.classList.remove('hidden');
            this.initCanvasEvents();
        };
        img.src = content;
    },

    initCanvasEvents() {
        if(this.canvas.getAttribute('data-init')) return;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.ctx.beginPath();
            const pos = getPos(e);
            this.ctx.moveTo(pos.x, pos.y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const pos = getPos(e);
            const color = document.getElementById('annotation-color').value;

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';

            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
            this.ctx.closePath();
        });

        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
        this.canvas.setAttribute('data-init', 'true');
    },

    setAnnotationTool(tool) {
        this.currentTool = tool;
        // Visual feedback for buttons could be added here
    },

    clearAnnotation() {
        if(confirm('Limpar todas as anotações?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    },

    saveAnnotation() {
        const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        const pericia = Storage.getPericia(this.currentPericiaId);

        pericia.documents.push({
            id: Date.now(),
            original_name: `Anotação_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`,
            content: dataUrl
        });

        Storage.savePericia(pericia);
        this.renderDocumentsList(pericia.documents);
        document.getElementById('annotation-modal').classList.add('hidden');
        this.showToast('Anotação salva!', 'success');
    }
};

window.onload = () => App.init();
