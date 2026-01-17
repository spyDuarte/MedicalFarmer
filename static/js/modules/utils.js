import { Storage } from './storage.js';

/* Input Masks Logic */
export const Mask = {
    cpf(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    phone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    currency(value) {
        // Simple currency input handling
        // Remove non-digits
        let v = value.replace(/\D/g, '');
        // Convert to float
        v = (parseFloat(v) / 100).toFixed(2);
        return isNaN(v) ? '0.00' : v;
    }
};

/* Validators */
export const Validator = {
    cpf(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }
};

/* Utils & Toast */
export const Utils = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800`;

        // Icon based on type
        let iconHtml = '';
        if(type === 'success') iconHtml = '<div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200"><i class="fa-solid fa-check"></i></div>';
        else if(type === 'error') iconHtml = '<div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200"><i class="fa-solid fa-exclamation"></i></div>';
        else iconHtml = '<div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-800 dark:text-blue-200"><i class="fa-solid fa-info"></i></div>';

        toast.innerHTML = `
            ${iconHtml}
            <div class="ml-3 text-sm font-normal">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" onclick="this.parentElement.remove()">
                <span class="sr-only">Close</span>
                <i class="fa-solid fa-times"></i>
            </button>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            if(toast.parentElement) toast.remove();
        }, 3000);
    },

    renderMacros() {
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
        // Listeners
        container.querySelectorAll('.delete-macro').forEach(btn => {
            btn.onclick = () => {
                if(confirm('Excluir modelo?')) {
                    Storage.deleteMacro(btn.dataset.id);
                    Utils.renderMacros();
                }
            };
        });
    }
};
