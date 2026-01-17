import { Storage } from './storage.js';

export const DashboardController = {
    statusChart: null,

    bindEvents() {
        const filters = ['status-filter', 'date-start', 'date-end', 'search-input'];
        filters.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                if(id === 'search-input') {
                    el.addEventListener('keyup', () => this.render());
                } else {
                    el.addEventListener('change', () => this.render());
                }
            }
        });

        // Note: Backup/Restore buttons are handled in app.js or MainController
        // because they are global actions, but they live in the dashboard view initially.
        // We will move their listener binding to app.js or here if specific to dashboard.
        // Given they are in the dashboard view container, we should bind them here if possible,
        // or ensure app.js binds them globally if they exist.
        // Let's bind them here for now if they are dashboard specific controls.
        // Wait, they are inside #view-dashboard in HTML.
    },

    render() {
        const pericias = Storage.getPericias();
        const tbody = document.getElementById('dashboard-table-body');
        if(!tbody) return;
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

        const elPending = document.getElementById('total-pendente');
        if(elPending) elPending.innerText = `R$ ${totalPendente.toFixed(2)}`;

        const elReceived = document.getElementById('total-recebido');
        if(elReceived) elReceived.innerText = `R$ ${totalRecebido.toFixed(2)}`;

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

    getStatusBadge(status) {
        const classes = {
            'Aguardando': 'bg-yellow-200 text-yellow-900',
            'Agendado': 'bg-blue-100 text-blue-900',
            'Em Andamento': 'bg-blue-200 text-blue-900',
            'Concluido': 'bg-green-200 text-green-900'
        };
        const cls = classes[status] || 'bg-gray-200 text-gray-900';
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${status}</span>`;
    }
};
