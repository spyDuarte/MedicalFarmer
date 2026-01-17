import { Storage } from './storage.js';
import { Mask, Validator } from './utils.js';
import { CID10 } from '../cid_data.js';

export const FormRenderer = {
    // Renders the form structure into the target container
    render(template, containerId, formController) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = ''; // Clear existing

        // Create Header (Title + Toolbar) - Actually, we might want to keep the header separate in the HTML
        // For now, let's assume we are rendering the TABS and the CONTENT.

        // 1. Render Tab Navigation
        const tabsNav = document.createElement('div');
        tabsNav.className = 'flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4 space-x-4 overflow-x-auto';

        template.sections.forEach((section, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : 'inactive'}`;
            btn.id = `btn-tab-${section.id}`;
            btn.innerText = section.title;
            btn.onclick = () => formController.switchTab(`tab-${section.id}`);
            tabsNav.appendChild(btn);
        });
        container.appendChild(tabsNav);

        // 2. Render Tab Content
        const contentContainer = document.createElement('div');
        contentContainer.className = 'p-6';

        template.sections.forEach((section, index) => {
            const tabDiv = document.createElement('div');
            tabDiv.id = `tab-${section.id}`;
            tabDiv.className = `tab-content ${index === 0 ? '' : 'hidden'}`;

            // Loop fields
            let currentRow = null;
            let widthAccumulator = 0;

            // Helper to close row
            const closeRow = () => {
                if(currentRow) {
                    tabDiv.appendChild(currentRow);
                    currentRow = null;
                    widthAccumulator = 0;
                }
            };

            const createRow = () => {
                const div = document.createElement('div');
                div.className = 'grid grid-cols-1 md:grid-cols-12 gap-6 mb-6';
                return div;
            };

            section.fields.forEach(field => {
                // Determine width span (1-12)
                let span = 12;
                if(field.width === 'half') span = 6;
                if(field.width === 'third') span = 4;
                if(field.width === 'quarter') span = 3;

                // Handle 'custom_upload' specially - usually takes full row or specific block
                if(field.type === 'custom_upload') {
                    closeRow();
                    tabDiv.appendChild(this.renderUploadSection(formController));
                    return;
                }

                // If current row is full, close it
                if (currentRow && (widthAccumulator + span > 12)) {
                    closeRow();
                }

                if (!currentRow) currentRow = createRow();

                const wrapper = document.createElement('div');
                wrapper.className = `col-span-1 md:col-span-${span}`;

                wrapper.appendChild(this.renderField(field, formController));
                currentRow.appendChild(wrapper);
                widthAccumulator += span;

                // If field is full width (richtext, textarea), often better to close row after
                if(span === 12) closeRow();
            });
            closeRow(); // Close any remaining

            contentContainer.appendChild(tabDiv);
        });

        container.appendChild(contentContainer);
    },

    renderField(field, controller) {
        const container = document.createElement('div');

        // Label
        if(field.label) {
            const label = document.createElement('label');
            label.className = "block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2";
            label.htmlFor = `f-${field.id}`;
            label.innerText = field.label;
            container.appendChild(label);
        }

        let input;

        switch(field.type) {
            case 'text':
            case 'date':
            case 'number':
                input = document.createElement('input');
                input.type = field.type;
                input.id = `f-${field.id}`;
                input.className = "border dark:border-gray-600 rounded w-full py-2 px-3 dark:bg-gray-700 dark:text-gray-200";
                if(field.mask === 'cpf') {
                    input.addEventListener('input', (e) => e.target.value = Mask.cpf(e.target.value));
                }
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.id = `f-${field.id}`;
                input.className = "border dark:border-gray-600 rounded w-full py-2 px-3 dark:bg-gray-700 dark:text-gray-200";
                input.rows = field.rows || 3;
                break;

            case 'select':
                input = document.createElement('select');
                input.id = `f-${field.id}`;
                input.className = "border dark:border-gray-600 rounded w-full py-2 px-3 dark:bg-gray-700 dark:text-gray-200";
                input.innerHTML = '<option value="">Selecione...</option>';
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.innerText = opt;
                    input.appendChild(option);
                });
                break;

            case 'display': // Read-only span
                input = document.createElement('div');
                input.className = "flex items-center pt-2";
                input.innerHTML = `<span id="f-${field.id}" class="text-blue-600 dark:text-blue-400 font-bold"></span>`;
                break;

            case 'cid_search':
                const wrap = document.createElement('div');
                wrap.className = "relative";

                const inp = document.createElement('input');
                inp.id = `f-${field.id}`;
                inp.type = 'text';
                inp.className = "border dark:border-gray-600 rounded w-full py-2 px-3 dark:bg-gray-700 dark:text-gray-200";
                inp.placeholder = "Digite código ou nome...";
                inp.autocomplete = "off";

                const ul = document.createElement('ul');
                ul.id = 'cid-suggestions'; // Should be unique if multiple CIDs, but standard app has one main CID usually.
                ul.className = "absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto hidden";

                // Add listeners in controller, or attach here
                inp.addEventListener('input', (e) => controller.handleCIDSearch(e, ul.id, inp.id));
                inp.addEventListener('blur', () => setTimeout(() => ul.classList.add('hidden'), 200));

                wrap.appendChild(inp);
                wrap.appendChild(ul);
                input = wrap;
                break;

            case 'richtext':
                const rtWrap = document.createElement('div');

                // Macro Select
                if (field.macroCategory) {
                    const macroRow = document.createElement('div');
                    macroRow.className = "flex justify-end items-end mb-1";

                    const macroSel = document.createElement('select');
                    macroSel.id = `macro-sel-${field.id}`;
                    macroSel.className = "text-xs border dark:border-gray-600 rounded p-1 dark:bg-gray-700 dark:text-gray-200";
                    macroSel.innerHTML = '<option value="">Inserir modelo...</option>';
                    // Controller will populate this later

                    macroRow.appendChild(macroSel);
                    rtWrap.appendChild(macroRow);
                }

                const editorDiv = document.createElement('div');
                editorDiv.id = `q-${field.id}`;
                editorDiv.className = "bg-white dark:text-black"; // Quill needs black text usually or specific dark mode css
                editorDiv.style.height = '200px'; // Default height

                rtWrap.appendChild(editorDiv);
                input = rtWrap;
                break;

            default:
                input = document.createElement('div');
                input.innerText = `Unknown field type: ${field.type}`;
        }

        if (input) container.appendChild(input);

        // Bind standard listeners
        const bindInput = (el) => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                el.addEventListener('input', () => controller.autoSave());
                el.addEventListener('change', () => controller.autoSave());

                if (field.listener === 'calcAge') {
                    el.addEventListener('change', () => controller.calcAge());
                }
            }
        };

        // Handle composite inputs
        if (input.tagName === 'DIV' || input.className && input.className.includes('relative')) {
           const subInput = input.querySelector('input');
           if (subInput) bindInput(subInput);
        } else {
            bindInput(input);
        }

        return container;
    },

    renderUploadSection(controller) {
        const div = document.createElement('div');
        div.className = "mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded border dark:border-gray-600";
        div.innerHTML = `
            <h4 class="font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">Anexar Documentos (PDF/Img)</h4>
            <div class="flex gap-2 mb-4">
                <input type="file" id="upload_document" class="text-sm border dark:border-gray-600 rounded w-full dark:text-gray-300">
                <button id="btn-upload" class="bg-gray-700 hover:bg-gray-600 text-white px-2 rounded"><i class="fa-solid fa-upload"></i></button>
            </div>
            <ul id="documents-list-ul" class="space-y-2"></ul>
        `;
        div.querySelector('#btn-upload').onclick = () => controller.handleFileUpload();
        return div;
    }
};
