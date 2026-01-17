import { Storage } from './storage.js';
import { PAYMENT_STATUS } from './constants.js';

/**
 * Controller for the Financial Reports View.
 */
export const FinanceController = {
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
            const val = parseFloat(p.valor_honorarios || 0);

            // Paid vs Pending
            if (p.status_pagamento === PAYMENT_STATUS.PAID) pendingVsPaid.paid += val;
            else pendingVsPaid.pending += val;

            // Monthly
            const dateStr = p.data_pericia || p.created_at;
            if (dateStr) {
                const date = new Date(dateStr);
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

                if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
                monthlyData[monthKey] += val;
            }
        });

        // --- Charts ---
        this.renderMonthlyChart(monthlyData);
        this.renderStatusChart(pendingVsPaid);

        // --- KPI Cards ---
        document.getElementById('fin-total-pending').innerText = `R$ ${pendingVsPaid.pending.toFixed(2)}`;
        document.getElementById('fin-total-paid').innerText = `R$ ${pendingVsPaid.paid.toFixed(2)}`;
    },

    /**
     * Renders the monthly revenue bar chart.
     * @param {Object} data - Monthly aggregation data.
     */
    renderMonthlyChart(data) {
        const ctx = document.getElementById('chart-finance-monthly');
        if(!ctx) return;

        // Destroy old instance if stored
        if(window.financeMonthlyChart instanceof Chart) window.financeMonthlyChart.destroy();

        const labels = Object.keys(data).sort();
        const values = labels.map(k => data[k]);

        window.financeMonthlyChart = new Chart(ctx, {
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

        if(window.financeStatusChart instanceof Chart) window.financeStatusChart.destroy();

        window.financeStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING],
                datasets: [{
                    data: [data.paid, data.pending],
                    backgroundColor: ['#22c55e', '#eab308']
                }]
            },
            options: {
                responsive: true
            }
        });
    }
};
