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

        let currentView = null;

        switch (path) {
            case 'dashboard':
                currentView = document.getElementById('view-dashboard');
                currentView.classList.remove('hidden');
                DashboardController.render();
                titleText = 'Dashboard';
                break;
            case 'nova':
                currentView = document.getElementById('view-form');
                currentView.classList.remove('hidden');
                FormController.renderForm(null);
                titleText = 'Nova Perícia';
                break;
            case 'editar':
                if (!id || id === '') {
                    window.location.hash = '#dashboard';
                    return;
                }
                currentView = document.getElementById('view-form');
                currentView.classList.remove('hidden');
                FormController.renderForm(id);
                titleText = 'Editar Perícia';
                break;
            case 'macros':
                currentView = document.getElementById('view-macros');
                currentView.classList.remove('hidden');
                MacrosController.render();
                titleText = 'Modelos de Texto';
                break;
            case 'print':
                if (!id) {
                    window.location.hash = '#dashboard';
                    return;
                }
                currentView = document.getElementById('view-print');
                currentView.classList.remove('hidden');
                PrintController.render(id);
                titleText = 'Visualizar Impressão';
                break;
            case 'settings':
                currentView = document.getElementById('view-settings');
                currentView.classList.remove('hidden');
                SettingsController.render();
                titleText = 'Configurações';
                break;
            case 'calendar':
                currentView = document.getElementById('view-calendar');
                currentView.classList.remove('hidden');
                CalendarController.render();
                titleText = 'Calendário';
                break;
            case 'financeiro':
                currentView = document.getElementById('view-finance');
                currentView.classList.remove('hidden');
                FinanceController.render();
                titleText = 'Financeiro';
                break;
            default:
                // 404 Fallback to Dashboard
                currentView = document.getElementById('view-dashboard');
                currentView.classList.remove('hidden');
                DashboardController.render();
        }

        if(titleEl) titleEl.textContent = titleText;

        // Accessibility: Move focus to the view or title for screen readers
        if (currentView) {
            // Wait for DOM updates or animations
            setTimeout(() => {
                if (titleEl) {
                    titleEl.setAttribute('tabindex', '-1');
                    titleEl.focus({ preventScroll: true });
                } else {
                    currentView.setAttribute('tabindex', '-1');
                    currentView.focus({ preventScroll: true });
                }
            }, 100);
        }
    }
};
