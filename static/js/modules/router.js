import { Storage } from './storage.js';
import { DashboardController } from './dashboard.js';
import { FormController } from './form.js';
import { CalendarController } from './calendar.js';
import { PrintController } from './print.js';
import { SettingsController } from './settings.js';
import { FinanceController } from './finance.js';
import { MacrosController } from './macros.js';
import { UI } from './ui.js';

export const Router = {
    init() {
        this.route();
        window.addEventListener('hashchange', () => this.route());
        this.bindGlobalEvents();
    },

    bindGlobalEvents() {
        // Global shortcuts (Ctrl+S, Ctrl+P)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (!document.getElementById('view-form').classList.contains('hidden')) {
                    FormController.saveForm();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (!document.getElementById('view-print').classList.contains('hidden')) {
                    window.print();
                }
            }
        });
    },

    route() {
        const hash = window.location.hash || '#dashboard';
        const [path, id] = hash.substring(1).split('/');

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        if (path === 'dashboard') {
            document.getElementById('view-dashboard').classList.remove('hidden');
            DashboardController.render();
        } else if (path === 'nova') {
            document.getElementById('view-form').classList.remove('hidden');
            FormController.renderForm(null);
        } else if (path === 'editar') {
            document.getElementById('view-form').classList.remove('hidden');
            FormController.renderForm(id);
        } else if (path === 'macros') {
            document.getElementById('view-macros').classList.remove('hidden');
            MacrosController.render();
        } else if (path === 'print') {
            document.getElementById('view-print').classList.remove('hidden');
            PrintController.render(id);
        } else if (path === 'settings') {
            document.getElementById('view-settings').classList.remove('hidden');
            SettingsController.render();
        } else if (path === 'calendar') {
            document.getElementById('view-calendar').classList.remove('hidden');
            CalendarController.render();
        } else if (path === 'financeiro') {
            document.getElementById('view-finance').classList.remove('hidden');
            FinanceController.render();
        }
    }
};
