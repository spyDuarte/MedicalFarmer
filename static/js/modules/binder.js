
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
     * @throws {Error} If container is not an HTMLElement.
     */
    bindToView(container, model, partial = false) {
        if (!(container instanceof HTMLElement)) {
            console.error('Binder: Container must be an HTMLElement');
            return;
        }
        if (!model || typeof model !== 'object') {
             // If model is null/undefined and partial is false, we might want to clear fields?
             // But usually this means "don't bind".
             return;
        }

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
     * @throws {Error} If container is not an HTMLElement.
     */
    bindToModel(container, baseModel = {}) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Binder: Container must be an HTMLElement');
        }

        const elements = container.querySelectorAll('[data-model]');
        // Shallow clone baseModel to avoid unexpected mutation of the original reference if reused elsewhere
        // But for deep nested sets, we usually modify 'model' directly.
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
     * @param {Object} obj
     * @param {string} path
     * @returns {*}
     * @private
     */
    _getValue(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
    },

    /**
     * Helper to set nested value.
     * @param {Object} obj
     * @param {string} path
     * @param {*} value
     * @private
     */
    _setValue(obj, path, value) {
        if (!path) return;
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') current[part] = {};
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }
};
