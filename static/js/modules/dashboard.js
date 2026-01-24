import { Storage } from './storage.js';
import { STATUS, PAYMENT_STATUS } from './constants.js';
import { Format, Utils } from './utils.js';
import { UI } from './ui.js';

/**
 * Controller for the Dashboard View.
 * Handles chart rendering and table filtering/sorting.
 */
export const DashboardController = {
    /** @type {Chart|null} */
    statusChart: null,

    currentSort: {
        field: 'createdAt',
        direction: 'desc'
    },

    /**
     * Binds events for dashboard filters and sorting.
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

        // Bind Sort Headers
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                const field = e.currentTarget.dataset.sort;
                this.handleSort(field);
            });
        });
    },

    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        this.render();
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

        let filtered = pericias.filter(p => {
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
        });

        // Sort
        filtered.sort((a, b) => {
            let valA = a[this.currentSort.field];
            let valB = b[this.currentSort.field];

            // Handle dates
            if (this.currentSort.field === 'dataPericia' || this.currentSort.field === 'createdAt') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            }
            // Handle strings
            else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB || '').toLowerCase();
            }

            if (valA < valB) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
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
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors";
            tr.innerHTML = `
                <td class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-sm">
                    ${this.getStatusBadge(p.status)}
                </td>
                <td class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-sm">
                    <p class="text-gray-900 dark:text-gray-100 font-semibold">${p.numeroProcesso || '-'}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-xs">${p.nomeAutor || 'Sem autor'}</p>
                </td>
                <td class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                     ${p.dataPericia ? Format.date(p.dataPericia) : '<span class="text-gray-400 italic">--/--/--</span>'}
                </td>
                <td class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-sm">
                    <div class="flex items-center justify-between">
                        <span class="font-mono text-gray-700 dark:text-gray-300 font-medium">${Format.currency(p.valorHonorarios)}</span>
                        ${p.statusPagamento === PAYMENT_STATUS.PAID
                            ? `<i class="fa-solid fa-check-circle text-green-500 ml-2" title="Pago"></i>`
                            : `<i class="fa-regular fa-clock text-yellow-500 ml-2" title="Pendente"></i>`}
                    </div>
                </td>
                <td class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-sm text-right">
                    <div class="flex items-center justify-end gap-2">
                        <a href="#editar/${p.id}" class="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors" title="Editar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </a>
                        ${p.status === STATUS.DONE
                            ? `<a href="#print/${p.id}" class="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors" title="Imprimir" target="_blank">
                                <i class="fa-solid fa-print"></i>
                               </a>`
                            : `<span class="p-2 w-8 inline-block"></span>`
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update Sort Icons & Aria Attributes
        document.querySelectorAll('.sortable').forEach(th => {
            const icon = th.querySelector('i');
            if(icon) icon.className = 'fa-solid fa-sort text-gray-300 ml-1';
            th.setAttribute('aria-sort', 'none');
        });

        const activeTh = document.querySelector(`.sortable[data-sort="${this.currentSort.field}"]`);
        if(activeTh) {
            const icon = activeTh.querySelector('i');
            if(icon) icon.className = `fa-solid fa-sort-${this.currentSort.direction === 'asc' ? 'up' : 'down'} text-primary-500 ml-1`;
            activeTh.setAttribute('aria-sort', this.currentSort.direction === 'asc' ? 'ascending' : 'descending');
        }

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
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: textColor, usePointStyle: true, boxWidth: 8 } }
                },
                cutout: '70%'
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
            [STATUS.WAITING]: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            [STATUS.SCHEDULED]: 'bg-blue-100 text-blue-700 border border-blue-200',
            [STATUS.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
            [STATUS.DONE]: 'bg-green-100 text-green-700 border border-green-200'
        };
        const cls = classes[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
        return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">${status}</span>`;
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
