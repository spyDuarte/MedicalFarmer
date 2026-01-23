import { Storage } from './storage.js';
import { UI } from './ui.js';

/**
 * Controller for Macros Management.
 */
export const MacrosController = {
    /**
     * Binds macro events.
     */
    bindEvents() {
        const btnSave = document.getElementById('btn-save-macro');
        if (btnSave) btnSave.addEventListener('click', () => this.saveMacro());
    },

    /**
     * Renders the macros list.
     */
    render() {
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

            // Safe injection for category and title, strict structure
            const categoryLabel = m.categoria ? m.categoria.replace('_', ' ').toUpperCase() : 'Geral';

            // Create elements properly to avoid innerHTML risks with user content (although m.conteudo is text, preventing HTML injection is safer)
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                 <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-blue-600 bg-blue-200">
                        ${categoryLabel}
                    </span>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100"></h3>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line mt-2"></p>
            `;
            // Set text content safely
            contentDiv.querySelector('h3').textContent = m.titulo;
            contentDiv.querySelector('p').textContent = m.conteudo;

            const btnDelete = document.createElement('button');
            btnDelete.className = "text-red-500 hover:text-red-700 ml-4";
            btnDelete.setAttribute('aria-label', 'Excluir Modelo');
            btnDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
            btnDelete.onclick = () => {
                UI.Modal.confirm('Excluir modelo?', () => {
                    Storage.deleteMacro(m.id);
                    this.render();
                    UI.Toast.show('Modelo excluído.', 'info');
                });
            };

            div.appendChild(contentDiv);
            div.appendChild(btnDelete);
            container.appendChild(div);
        });
    },

    /**
     * Saves a new macro.
     */
    saveMacro() {
        const titleEl = document.getElementById('m-titulo');
        const catEl = document.getElementById('m-categoria');
        const contentEl = document.getElementById('m-conteudo');

        if(!titleEl || !catEl || !contentEl) return;

        const title = titleEl.value.trim();
        const category = catEl.value;
        const content = contentEl.value.trim();

        if(title && content) {
            Storage.addMacro({ titulo: title, categoria: category, conteudo: content });
            titleEl.value = '';
            contentEl.value = '';
            this.render();
            UI.Toast.show('Modelo adicionado!', 'success');
        } else {
            UI.Toast.show('Preencha todos os campos.', 'warning');
        }
    }
};
