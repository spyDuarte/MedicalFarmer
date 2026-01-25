import { Router } from './modules/router.js';
import { Storage } from './modules/storage.js';
import { FormController } from './modules/form.js';
import { SettingsController } from './modules/settings.js';
import { PrintController } from './modules/print.js';
import { DashboardController } from './modules/dashboard.js';
import { MacrosController } from './modules/macros.js';
import { TemplatesController } from './modules/templates.js';
import { UI } from './modules/ui.js';

/**
 * Main Application Controller.
 * Bootstrap logic and Global Event Handling.
 * @namespace MainController
 */
const MainController = {
    /**
     * Initializes the application.
     * Orchestrates the setup of UI themes, routing, and event binding for all modules.
     * Catches and displays any initialization errors via Toast.
     */
    init() {
        try {
            UI.Theme.init();
            Router.init();

            // Bind Events across modules
            this.bindGlobalEvents();
            FormController.bindEvents();
            SettingsController.bindEvents();
            DashboardController.bindEvents();
            PrintController.bindEvents();
            MacrosController.bindEvents();
            TemplatesController.bindEvents();
        } catch (error) {
            console.error("Initialization Error:", error);
            UI.Toast.show("Erro ao inicializar o sistema. Verifique o console.", 'error', 10000);
        }
    },

    /**
     * Binds global application events (Theme, Backup, Annotations).
     */
    bindGlobalEvents() {
        // Theme Toggle
        const themeBtn = document.getElementById('btn-toggle-theme');
        if(themeBtn) themeBtn.addEventListener('click', () => UI.Theme.toggle());

        // Backup & Restore (Global logic)
        const btnExport = document.getElementById('btn-export-backup');
        if(btnExport) btnExport.addEventListener('click', () => this.handleExport());

        const inputImport = document.getElementById('input-import-backup');
        if(inputImport) inputImport.addEventListener('change', (e) => this.handleImport(e));
    },

    /**
     * Handles Data Export.
     */
    async handleExport() {
        const password = UI.Modal.prompt("Deseja proteger o backup com senha? (Deixe em branco para não criptografar)");
        if (password === null) return;

        UI.Loading.show();
        try {
            const { filename, content } = await Storage.getExportData(password);
            const blob = new Blob([content], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            UI.Toast.show('Backup gerado com sucesso!', 'success');
        } catch (e) {
            UI.Toast.show(e.message, 'error');
        } finally {
            UI.Loading.hide();
        }
    },

    /**
     * Handles Data Import.
     * @param {Event} e
     */
    handleImport(e) {
        const file = e.target.files[0];
        if(!file) return;

        UI.Modal.confirm("ATENÇÃO: Isso irá substituir todos os dados atuais pelos do backup. Deseja continuar?", () => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;

                let password = null;
                if (file.name.endsWith('.enc')) {
                    password = UI.Modal.prompt("Este backup está criptografado. Digite a senha:");
                    if (password === null) { e.target.value = ""; return; }
                }

                UI.Loading.show();
                try {
                    await Storage.processImportData(content, password);
                    UI.Toast.show("Dados restaurados com sucesso!", 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    if (!password && err.message.includes("criptografado")) {
                         UI.Toast.show("Erro: O arquivo parece estar criptografado. Renomeie para .enc ou tente novamente.", 'error');
                    } else {
                        UI.Toast.show(err.message, 'error');
                    }
                } finally {
                    UI.Loading.hide();
                    e.target.value = "";
                }
            };
            reader.readAsText(file);
        });
    },
};

document.addEventListener('DOMContentLoaded', () => {
    MainController.init();
});
