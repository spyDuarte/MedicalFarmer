import { Storage } from './storage.js';
import { UI } from './ui.js';

/**
 * Controller for Managing Templates.
 */
export const TemplatesController = {
    /**
     * Binds events for the templates module.
     */
    bindEvents() {
        const btnOpen = document.getElementById('btn-open-templates');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => this.openManager());
        }

        const btnClose = document.getElementById('btn-close-templates');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                const modal = document.getElementById('templates-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    UI.Modal.releaseFocus(modal);
                }
            });
        }
    },

    /**
     * Opens the Template Manager modal.
     */
    openManager() {
        const modal = document.getElementById('templates-modal');
        if (!modal) return;

        this.renderList();
        modal.classList.remove('hidden');
        UI.Modal.trapFocus(modal);
    },

    /**
     * Renders the list of templates.
     */
    renderList() {
        const list = document.getElementById('templates-list');
        if (!list) return;

        list.innerHTML = '';
        const templates = Storage.getTemplates();

        if (templates.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                    <p>Nenhum template salvo.</p>
                    <p class="text-xs mt-1">Crie templates a partir do editor de perícia.</p>
                </div>
            `;
            return;
        }

        templates.forEach(t => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:border-primary-200 dark:hover:border-primary-700 transition-colors group";

            let dateStr = "Template Padrão";
            // Check if ID is a timestamp (number)
            if (typeof t.id === 'number') {
                const date = new Date(t.id);
                if (!isNaN(date.getTime())) {
                    dateStr = `Criado em: ${date.toLocaleDateString()}`;
                }
            }

            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-primary-500 shadow-sm">
                        <i class="fa-solid fa-file-medical"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-gray-800 dark:text-gray-100 truncate">${t.title}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${dateStr}</p>
                    </div>
                </div>
                <button class="btn-delete-template text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Excluir Template">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            const btnDelete = div.querySelector('.btn-delete-template');
            btnDelete.onclick = () => this.deleteTemplate(t.id);

            list.appendChild(div);
        });
    },

    /**
     * Deletes a template.
     * @param {number} id - Template ID.
     */
    deleteTemplate(id) {
        UI.Modal.confirm('Tem certeza que deseja excluir este template?', () => {
            Storage.deleteTemplate(id);
            this.renderList();
            UI.Toast.show('Template excluído.', 'success');
        });
    }
};
