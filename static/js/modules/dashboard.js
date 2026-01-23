import { Storage } from './storage.js';
import { STATUS, PAYMENT_STATUS } from './constants.js';
import { Format, Utils } from './utils.js';
import { UI } from './ui.js';

/**
 * Controller for the Dashboard View.
 * Handles chart rendering and table filtering.
 */
export const DashboardController = {
    /** @type {Chart|null} */
    statusChart: null,

    /**
     * Binds events for dashboard filters.
     */
    bindEvents() {
        const filters = ['status-filter', 'date-start', 'date-end'];
        filters.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('change', () => this.render());
            }
        });

        const searchInput = document.getElementById('search-input');
        if(searchInput) {
            searchInput.addEventListener('keyup', Utils.debounce(() => this.render(), 300));
        }

        const btnExportCsv = document.getElementById('btn-export-csv');
        if(btnExportCsv) {
            btnExportCsv.addEventListener('click', () => this.exportToCSV());
        }
    },

    /**
     * Filters pericias based on current filter state.
     * @param {Array} pericias - List of pericias.
     * @returns {Array} Filtered list.
     */
    filterPericias(pericias) {
        if (!Array.isArray(pericias)) return [];

        const searchInput = document.getElementById('search-input');
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const statusSelect = document.getElementById('status-filter');
        const statusFilter = statusSelect ? statusSelect.value : '';
        const dateStartInput = document.getElementById('date-start');
        const dateStart = dateStartInput ? dateStartInput.value : '';
        const dateEndInput = document.getElementById('date-end');
        const dateEnd = dateEndInput ? dateEndInput.value : '';

        return pericias.filter(p => {
             // Access camelCase properties
             const matchesSearch = !search ||
                 (p.numeroProcesso && p.numeroProcesso.toLowerCase().includes(search)) ||
                 (p.nomeAutor && p.nomeAutor.toLowerCase().includes(search));

             const matchesStatus = !statusFilter || p.status === statusFilter;

             let matchesDate = true;
             if (dateStart || dateEnd) {
                 const pDate = p.dataPericia ? new Date(p.dataPericia) : null;
                 if (!pDate || isNaN(pDate.getTime())) matchesDate = false;
                 else {
                     // Normalize time for comparison
                     const pTime = pDate.getTime();
                     if (dateStart) {
                         const dStart = new Date(dateStart).getTime();
                         if (!isNaN(dStart) && pTime < dStart) matchesDate = false;
                     }
                     if (dateEnd) {
                         const dEnd = new Date(dateEnd).getTime();
                         if (!isNaN(dEnd) && pTime > dEnd) matchesDate = false;
                     }
                 }
             }

             return matchesSearch && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    /**
     * Renders the dashboard table and charts based on filters.
     */
    render() {
        const pericias = Storage.getPericias();
        const tbody = document.getElementById('dashboard-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';

        const filtered = this.filterPericias(pericias);

        let totalReceived = 0;
        let totalPending = 0;
        const stats = {};
        Object.values(STATUS).forEach(s => stats[s] = 0);

        filtered.forEach(p => {
            if (p.statusPagamento === PAYMENT_STATUS.PAID) totalReceived += parseFloat(p.valorHonorarios || 0);
            else totalPending += parseFloat(p.valorHonorarios || 0);

            if (stats[p.status] !== undefined) stats[p.status]++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    ${this.getStatusBadge(p.status)}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    <p class="text-gray-900 dark:text-gray-100 font-bold">${p.numeroProcesso || '-'}</p>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">${p.nomeAutor || '-'}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">
                     ${p.dataPericia ? Format.date(p.dataPericia) : '<span class="italic text-gray-400">Não agendado</span>'}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    <p class="font-mono text-gray-800 dark:text-gray-200">${Format.currency(p.valorHonorarios)}</p>
                    ${p.statusPagamento === PAYMENT_STATUS.PAID
                        ? `<span class="text-xs text-green-600 dark:text-green-400"><i class="fa-solid fa-check"></i> ${PAYMENT_STATUS.PAID}</span>`
                        : `<span class="text-xs text-yellow-600 dark:text-yellow-400"><i class="fa-solid fa-clock"></i> ${PAYMENT_STATUS.PENDING}</span>`}
                </td>
                <td class="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm flex gap-2">
                    <a href="#editar/${p.id}" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><i class="fa-solid fa-pen-to-square fa-lg"></i></a>
                    ${p.status === STATUS.DONE ? `<a href="#print/${p.id}" target="_blank" class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"><i class="fa-solid fa-file-pdf fa-lg"></i></a>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        const elPending = document.getElementById('total-pendente');
        if(elPending) elPending.innerText = Format.currency(totalPending);

        const elReceived = document.getElementById('total-recebido');
        if(elReceived) elReceived.innerText = Format.currency(totalReceived);

        this.renderCharts(stats);
    },

    /**
     * Renders the status distribution chart.
     * @param {Object} stats - Count of pericias per status.
     */
    renderCharts(stats) {
        const ctx = document.getElementById('chart-status');
        if (!ctx) return;
        // eslint-disable-next-line no-undef
        if (this.statusChart) this.statusChart.destroy();

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e5e7eb' : '#374151';

        // eslint-disable-next-line no-undef
        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [STATUS.WAITING, STATUS.SCHEDULED, STATUS.IN_PROGRESS, STATUS.DONE],
                datasets: [{
                    data: [stats[STATUS.WAITING], stats[STATUS.SCHEDULED], stats[STATUS.IN_PROGRESS], stats[STATUS.DONE]],
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

    /**
     * Generates HTML badge for status.
     * @param {string} status
     * @returns {string} HTML string.
     */
    getStatusBadge(status) {
        const classes = {
            [STATUS.WAITING]: 'bg-yellow-200 text-yellow-900',
            [STATUS.SCHEDULED]: 'bg-blue-100 text-blue-900',
            [STATUS.IN_PROGRESS]: 'bg-blue-200 text-blue-900',
            [STATUS.DONE]: 'bg-green-200 text-green-900'
        };
        const cls = classes[status] || 'bg-gray-200 text-gray-900';
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${status}</span>`;
    },

    /**
     * Exports data to CSV.
     */
    exportToCSV() {
        const pericias = Storage.getPericias();
        if (pericias.length === 0) {
            UI.Toast.show('Não há dados para exportar.', 'warning');
            return;
        }

        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes('"') || str.includes(';')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = ['ID', 'Data Criação', 'Status', 'Processo', 'Autor', 'Data Perícia', 'Honorários', 'Status Pagamento', 'Cidade', 'UF'];
        const rows = pericias.map(p => [
            escapeCsv(p.id),
            escapeCsv(p.createdAt.split('T')[0]),
            escapeCsv(p.status),
            escapeCsv(p.numeroProcesso),
            escapeCsv(p.nomeAutor),
            escapeCsv(p.dataPericia ? p.dataPericia.split('T')[0] : ''),
            escapeCsv((p.valorHonorarios || 0).toString().replace('.', ',')),
            escapeCsv(p.statusPagamento),
            escapeCsv(p.endereco?.cidade),
            escapeCsv(p.endereco?.uf)
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + rows.map(e => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pericias_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
