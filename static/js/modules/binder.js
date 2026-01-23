
/**
 * Data Binding Utility.
 * Maps DOM elements to Data Objects and vice-versa using 'data-model' attributes.
 */
export const Binder = {
    /**
     * Populates the form elements in the container with data from the model.
     * @param {HTMLElement} container - The DOM element containing the form fields.
     * @param {Object} model - The data object.
     * @param {boolean} [partial=false] - If true, only updates fields present in the model.
     */
    bindToView(container, model, partial = false) {
        const elements = container.querySelectorAll('[data-model]');
        elements.forEach(el => {
            const path = el.getAttribute('data-model');
            const value = this._getValue(model, path);

            if (partial && value === undefined) return;

            if (el.type === 'checkbox') {
                el.checked = !!value;
            } else if (el.type === 'radio') {
                if (el.value === String(value)) {
                    el.checked = true;
                }
            } else {
                el.value = (value === null || value === undefined) ? '' : value;
            }
        });
    },

    /**
     * Collects data from form elements in the container into a new object.
     * @param {HTMLElement} container - The DOM element containing the form fields.
     * @param {Object} [baseModel={}] - Optional base object to merge data into.
     * @returns {Object} The populated data object.
     */
    bindToModel(container, baseModel = {}) {
        const elements = container.querySelectorAll('[data-model]');
        // Deep clone baseModel to avoid mutation side-effects if needed,
        // but here we usually want to modify it or return a new one.
        // We'll operate on the provided object directly or a new one.
        const model = baseModel;

        elements.forEach(el => {
            const path = el.getAttribute('data-model');
            let value;

            if (el.type === 'checkbox') {
                value = el.checked;
            } else if (el.type === 'radio') {
                if (el.checked) value = el.value;
                else return; // Don't set if not checked
            } else if (el.type === 'number') {
                value = el.value === '' ? null : parseFloat(el.value);
            } else {
                value = el.value;
            }

            this._setValue(model, path, value);
        });

        return model;
    },

    /**
     * Helper to get nested value.
     */
    _getValue(obj, path) {
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
    },

    /**
     * Helper to set nested value.
     */
    _setValue(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = {};
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }
};
