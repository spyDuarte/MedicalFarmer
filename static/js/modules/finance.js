import { Storage } from './storage.js';
import { PAYMENT_STATUS } from './constants.js';
import { Format } from './utils.js';

/**
 * Controller for the Financial Reports View.
 */
export const FinanceController = {
    monthlyChart: null,
    statusChart: null,

    /**
     * Renders financial charts and KPIs.
     */
    render() {
        const pericias = Storage.getPericias();
        const container = document.getElementById('view-finance');
        if(!container) return;

        // --- Data Aggregation ---
        const monthlyData = {};
        const pendingVsPaid = { paid: 0, pending: 0 };

        pericias.forEach(p => {
            const val = parseFloat(p.valorHonorarios || 0);

            // Paid vs Pending
            if (p.statusPagamento === PAYMENT_STATUS.PAID) pendingVsPaid.paid += val;
            else pendingVsPaid.pending += val;

            // Monthly
            const dateStr = p.dataPericia || p.createdAt;
            if (dateStr) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
                    monthlyData[monthKey] += val;
                }
            }
        });

        // --- Charts ---
        this.renderMonthlyChart(monthlyData);
        this.renderStatusChart(pendingVsPaid);

        // --- KPI Cards ---
        const elPending = document.getElementById('fin-total-pending');
        const elPaid = document.getElementById('fin-total-paid');

        if(elPending) elPending.innerText = Format.currency(pendingVsPaid.pending);
        if(elPaid) elPaid.innerText = Format.currency(pendingVsPaid.paid);
    },

    /**
     * Renders the monthly revenue bar chart.
     * @param {Object} data - Monthly aggregation data.
     */
    renderMonthlyChart(data) {
        const ctx = document.getElementById('chart-finance-monthly');
        if(!ctx) return;

        // eslint-disable-next-line no-undef
        if(this.monthlyChart instanceof Chart) this.monthlyChart.destroy();

        const labels = Object.keys(data).sort();
        const values = labels.map(k => data[k]);

        // eslint-disable-next-line no-undef
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Honorários (R$)',
                    data: values,
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    /**
     * Renders the Paid vs Pending doughnut chart.
     * @param {Object} data - Paid vs Pending amounts.
     */
    renderStatusChart(data) {
        const ctx = document.getElementById('chart-finance-status');
        if(!ctx) return;

        // eslint-disable-next-line no-undef
        if(this.statusChart instanceof Chart) this.statusChart.destroy();

        // eslint-disable-next-line no-undef
        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING],
                datasets: [{
                    data: [data.paid, data.pending],
                    backgroundColor: ['#22c55e', '#eab308']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
};
