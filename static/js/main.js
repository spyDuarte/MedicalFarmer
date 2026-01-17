import { Router } from './modules/router.js';
import { Storage } from './modules/storage.js';
import { FormController } from './modules/form.js';
import { SettingsController } from './modules/settings.js';
import { PrintController } from './modules/print.js';

// Expose Storage for debugging and external access
window.AppStorage = Storage;

// Global App Object (to bridge HTML onclick events to Modules)
window.App = {
    // Bridges
    saveForm: (finalize) => FormController.saveForm(finalize),
    handleFileUpload: () => FormController.handleFileUpload(),
    saveAsTemplate: () => FormController.saveAsTemplate(),

    // Settings
    saveSettings: () => SettingsController.save(),
    openSignatureModal: () => SettingsController.openSignatureModal(),
    clearSignature: () => SettingsController.clearSignature(),
    saveSignature: () => SettingsController.saveSignature(),

    // Print
    exportPDF: () => PrintController.exportPDF(),

    // Macros (Simple implementation here)
    saveMacro: () => {
        const title = document.getElementById('m-titulo').value;
        const cat = document.getElementById('m-categoria').value;
        const content = document.getElementById('m-conteudo').value;
        if(title && content) {
            Storage.addMacro({titulo: title, categoria: cat, conteudo: content});
            document.getElementById('m-titulo').value = '';
            document.getElementById('m-conteudo').value = '';
            window.App.renderMacros();
            alert('Modelo adicionado!');
        } else {
            alert('Preencha todos os campos.');
        }
    },

    renderMacros: () => {
        const macros = Storage.getMacros();
        const container = document.getElementById('macros-list');
        if(!container) return;
        container.innerHTML = '';
        if (macros.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center p-4">Nenhum modelo cadastrado.</p>';
            return;
        }
        macros.forEach(m => {
            const div = document.createElement('div');
            div.className = "bg-white dark:bg-gray-800 shadow border-l-4 border-blue-500 rounded p-4 flex justify-between items-start mb-4";
            div.innerHTML = `
                <div>
                     <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-blue-600 bg-blue-200">
                            ${m.categoria.replace('_', ' ')}
                        </span>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${m.titulo}</h3>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line mt-2">${m.conteudo}</p>
                </div>
                <button class="text-red-500 hover:text-red-700 ml-4 delete-macro" data-id="${m.id}"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(div);
        });
        // Listeners for dynamic buttons
        container.querySelectorAll('.delete-macro').forEach(btn => {
            btn.onclick = () => {
                if(confirm('Excluir modelo?')) {
                    Storage.deleteMacro(btn.dataset.id);
                    window.App.renderMacros();
                }
            };
        });
    },

    deleteMacro: (id) => { /* Handled by listener above */ },

    // Tabs
    switchTab: (id) => FormController.switchTab(id),

    // File/Annotation
    downloadFile: (id, name) => FormController.downloadFile(id, name),
    deleteFile: (id) => FormController.deleteFile(id),
    openAnnotation: (id) => FormController.openAnnotation(id),
    setAnnotationTool: (tool) => { FormController.currentTool = tool; }, // Simple state
    clearAnnotation: () => {
        const canvas = FormController.canvas;
        const ctx = FormController.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(FormController.currentImage) ctx.drawImage(FormController.currentImage, 0, 0, canvas.width, canvas.height);
    },
    saveAnnotation: () => FormController.saveAnnotation(),

    // Backup
    exportData: () => Storage.exportData(),
    importData: (el) => Storage.importData(el),

    // Theme
    toggleTheme: () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.theme = 'light';
            document.getElementById('theme-icon').classList.remove('fa-sun');
            document.getElementById('theme-icon').classList.add('fa-moon');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.theme = 'dark';
            document.getElementById('theme-icon').classList.remove('fa-moon');
            document.getElementById('theme-icon').classList.add('fa-sun');
        }
    }
};

// Initialize
window.onload = async () => {
    // Theme Init
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        const icon = document.getElementById('theme-icon');
        if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }

    try {
        await Storage.init();
    } catch (e) {
        console.error("Failed to initialize storage:", e);
        alert("Erro crítico ao carregar banco de dados local. Verifique o console.");
    }

    Router.init();
};
