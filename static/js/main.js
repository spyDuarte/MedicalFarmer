import { Router } from './modules/router.js';
import { Storage } from './modules/storage.js';
import { FormController } from './modules/form.js';
import { SettingsController } from './modules/settings.js';
import { PrintController } from './modules/print.js';
import { Modals } from './components/modals.js';
import { Utils } from './modules/utils.js';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Modals (Inject HTML)
    Modals.init();

    // 2. Initialize Router
    Router.init();

    // 3. Theme Init
    initTheme();

    // 4. Bind Global Events (Replacing onclicks)
    bindGlobalEvents();

    // 5. Service Worker Registration
    registerServiceWorker();
});

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        const icon = document.getElementById('theme-icon');
        if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

function bindGlobalEvents() {
    // Theme Toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);

    // Form Actions
    document.getElementById('btn-save')?.addEventListener('click', () => FormController.saveForm(false));
    document.getElementById('btn-finalize')?.addEventListener('click', () => FormController.saveForm(true));
    document.getElementById('btn-save-template')?.addEventListener('click', () => FormController.saveAsTemplate());
    document.getElementById('btn-upload')?.addEventListener('click', () => FormController.handleFileUpload());

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tab; // We added data-tab in index.html
            FormController.switchTab(tabId);
        });
    });

    // Template Management
    document.getElementById('btn-manage-templates')?.addEventListener('click', () => {
        // Assuming this modal exists in HTML or needs to be extracted.
        // Based on diff, it was 'new-pericia-template-modal'.
        // I might have missed extracting this one or it's still in index.html (I didn't remove it in diff).
        document.getElementById('new-pericia-template-modal')?.classList.remove('hidden');
    });

    // Settings Actions
    document.getElementById('btn-save-settings')?.addEventListener('click', () => SettingsController.save());
    document.getElementById('btn-open-signature')?.addEventListener('click', () => SettingsController.openSignatureModal());

    // Signature Modal Actions
    document.getElementById('btn-signature-clear')?.addEventListener('click', () => SettingsController.clearSignature());
    document.getElementById('btn-signature-save')?.addEventListener('click', () => SettingsController.saveSignature());
    document.getElementById('btn-signature-cancel')?.addEventListener('click', () => document.getElementById('signature-modal').classList.add('hidden'));

    // Annotation Modal Actions
    document.getElementById('btn-tool-pen')?.addEventListener('click', () => { FormController.currentTool = 'pen'; highlightTool('btn-tool-pen'); });
    document.getElementById('btn-tool-text')?.addEventListener('click', () => { FormController.currentTool = 'text'; highlightTool('btn-tool-text'); });
    document.getElementById('btn-annotation-clear')?.addEventListener('click', () => {
        const canvas = document.getElementById('annotation-canvas'); // Get canvas directly or from controller
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(FormController.currentImage) ctx.drawImage(FormController.currentImage, 0, 0, canvas.width, canvas.height);
    });
    document.getElementById('btn-annotation-save')?.addEventListener('click', () => FormController.saveAnnotation());
    document.getElementById('btn-annotation-cancel')?.addEventListener('click', () => document.getElementById('annotation-modal').classList.add('hidden'));
    document.getElementById('btn-annotation-close-x')?.addEventListener('click', () => document.getElementById('annotation-modal').classList.add('hidden'));

    // Print Actions
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => PrintController.exportPDF());

    // Dashboard Actions
    document.getElementById('status-filter')?.addEventListener('change', () => import('./modules/dashboard.js').then(m => m.DashboardController.render()));
    document.getElementById('date-start')?.addEventListener('change', () => import('./modules/dashboard.js').then(m => m.DashboardController.render()));
    document.getElementById('date-end')?.addEventListener('change', () => import('./modules/dashboard.js').then(m => m.DashboardController.render()));
    document.getElementById('search-input')?.addEventListener('keyup', () => import('./modules/dashboard.js').then(m => m.DashboardController.render()));

    // Backup
    document.getElementById('btn-backup-export')?.addEventListener('click', () => Storage.exportData());
    document.getElementById('input-backup-import')?.addEventListener('change', (e) => Storage.importData(e.target));

    // Template Selector
    document.getElementById('template-selector')?.addEventListener('change', (e) => FormController.loadTemplate(e.target.value));
}

function highlightTool(id) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active', 'bg-gray-300'));
    const btn = document.getElementById(id);
    if(btn) btn.classList.add('active', 'bg-gray-300');
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.theme = 'light';
        const icon = document.getElementById('theme-icon');
        if(icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.theme = 'dark';
        const icon = document.getElementById('theme-icon');
        if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('SW Registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New update available
                        showUpdateToast(newWorker);
                    }
                });
            });
        });

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }
}

function showUpdateToast(worker) {
    const toast = document.createElement('div');
    toast.className = 'bg-blue-600 text-white px-6 py-4 rounded shadow-lg flex justify-between items-center gap-4 animate-bounce';
    toast.innerHTML = `
        <span>Nova versão disponível!</span>
        <button class="bg-white text-blue-600 px-3 py-1 rounded font-bold text-sm hover:bg-gray-100">Atualizar</button>
    `;
    toast.querySelector('button').onclick = () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
    };

    const container = document.getElementById('toast-container');
    if(container) container.appendChild(toast);
}
