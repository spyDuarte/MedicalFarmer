import { DashboardController } from './dashboard.js';
import { FormController } from './form.js';
import { CalendarController } from './calendar.js';
import { PrintController } from './print.js';
import { SettingsController } from './settings.js';
import { FinanceController } from './finance.js';
import { MacrosController } from './macros.js';
import { UI } from './ui.js';

/**
 * SPA Router.
 * Handles hash changes and view switching.
 */
export const Router = {
    /**
     * Initializes the router.
     */
    init() {
        this.route();
        window.addEventListener('hashchange', () => this.route());
        this.bindGlobalEvents();
        // Initialize Sidebar logic
        UI.Sidebar.init();
    },

    /**
     * Binds global shortcuts.
     */
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

    /**
     * Routes based on current location hash.
     */
    route() {
        const hash = window.location.hash || '#dashboard';
        const [path, id] = hash.substring(1).split('/');

        // Update Title
        const titleEl = document.getElementById('page-title');
        let titleText = 'Dashboard';

        // Update Active Sidebar Link
        UI.Sidebar.setActive(hash);

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        switch (path) {
            case 'dashboard':
                document.getElementById('view-dashboard').classList.remove('hidden');
                DashboardController.render();
                titleText = 'Dashboard';
                break;
            case 'nova':
                document.getElementById('view-form').classList.remove('hidden');
                FormController.renderForm(null);
                titleText = 'Nova Perícia';
                break;
            case 'editar':
                document.getElementById('view-form').classList.remove('hidden');
                FormController.renderForm(id);
                titleText = 'Editar Perícia';
                break;
            case 'macros':
                document.getElementById('view-macros').classList.remove('hidden');
                MacrosController.render();
                titleText = 'Modelos de Texto';
                break;
            case 'print':
                document.getElementById('view-print').classList.remove('hidden');
                PrintController.render(id);
                titleText = 'Visualizar Impressão';
                break;
            case 'settings':
                document.getElementById('view-settings').classList.remove('hidden');
                SettingsController.render();
                titleText = 'Configurações';
                break;
            case 'calendar':
                document.getElementById('view-calendar').classList.remove('hidden');
                CalendarController.render();
                titleText = 'Calendário';
                break;
            case 'financeiro':
                document.getElementById('view-finance').classList.remove('hidden');
                FinanceController.render();
                titleText = 'Financeiro';
                break;
            default:
                document.getElementById('view-dashboard').classList.remove('hidden');
                DashboardController.render();
        }

        if(titleEl) titleEl.textContent = titleText;
    }
};
