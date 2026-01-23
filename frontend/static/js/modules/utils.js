/**
 * Utility for Input Masking.
 */
export const Mask = {
    /**
     * Masks a value as CPF (000.000.000-00).
     * @param {string} value - The input value.
     * @returns {string} The masked CPF string.
     */
    cpf(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    /**
     * Masks a value as CNPJ (00.000.000/0000-00).
     * @param {string} value - The input value.
     * @returns {string} The masked CNPJ string.
     */
    cnpj(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    /**
     * Masks a value as CEP (00000-000).
     * @param {string} value - The input value.
     * @returns {string} The masked CEP string.
     */
    cep(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },

    /**
     * Masks a value as Phone ( (00) 00000-0000 ).
     * @param {string} value - The input value.
     * @returns {string} The masked Phone string.
     */
    phone(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    /**
     * Masks a value as Currency (0.00).
     * @param {string|number} value - The input value.
     * @returns {string} The formatted currency string.
     */
    currency(value) {
        if (value === null || value === undefined) return '0.00';
        const strValue = String(value);
        let v = strValue.replace(/\D/g, '');
        v = (parseFloat(v) / 100).toFixed(2);
        return isNaN(v) ? '0.00' : v;
    }
};

/**
 * Utility for Validation.
 */
export const Validator = {
    /**
     * Validates a CPF number using Mod11 algorithm.
     * @param {string} cpf - The CPF string to validate.
     * @returns {boolean} True if the CPF is valid, false otherwise.
     */
    cpf(cpf) {
        if (typeof cpf !== 'string') return false;
        const cleanCpf = cpf.replace(/[^\d]+/g, '');
        if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCpf.substring(9, 10), 10)) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCpf.substring(10, 11), 10)) return false;

        return true;
    },

    /**
     * Validates a CNPJ number.
     * @param {string} cnpj - The CNPJ string to validate.
     * @returns {boolean} True if the CNPJ is valid, false otherwise.
     */
    cnpj(cnpj) {
        if (typeof cnpj !== 'string') return false;
        const cleanCnpj = cnpj.replace(/[^\d]+/g, '');
        if (cleanCnpj === '') return false;
        if (cleanCnpj.length !== 14) return false;
        // Eliminate known invalid CNPJs
        if (/^(\d)\1+$/.test(cleanCnpj)) return false;

        let size = cleanCnpj.length - 2;
        let numbers = cleanCnpj.substring(0, size);
        const digits = cleanCnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i), 10) * pos--;
            if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0), 10)) return false;

        size = size + 1;
        numbers = cleanCnpj.substring(0, size);
        sum = 0;
        pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i), 10) * pos--;
            if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(1), 10)) return false;

        return true;
    },

    /**
     * Validates an Email address.
     * @param {string} email - The email string to validate.
     * @returns {boolean} True if the email is valid, false otherwise.
     */
    email(email) {
        if (typeof email !== 'string') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

/**
 * Utility for International Formatting.
 */
export const Format = {
    /**
     * Formats a date string or object to the user's locale (default pt-BR).
     * @param {string|Date} date - The date to format.
     * @returns {string} Formatted date string or '-' if invalid.
     */
    date(date) {
        if (!date) return '-';
        let d = date;

        // Handle ISO strings that might come without time (YYYY-MM-DD)
        // by appending T00:00:00 to prevent timezone offsets shifting the day
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            d = date + 'T00:00:00';
        }

        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return '-';

        return new Intl.DateTimeFormat('pt-BR').format(dateObj);
    },

    /**
     * Formats a number as currency (BRL).
     * @param {number|string} value - The numeric value to format.
     * @returns {string} Formatted currency string.
     */
    currency(value) {
        if (value === null || value === undefined) return 'R$ 0,00';
        const v = parseFloat(value);
        if (isNaN(v)) return 'R$ 0,00';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(v);
    }
};

/**
 * Utility for safe JSON parsing.
 */
export const JSONUtils = {
    /**
     * Safely parses a JSON string with fallback and logging.
     * @param {string|null|undefined} value - The JSON string.
     * @param {*} fallback - The fallback value if parsing fails.
     * @param {string} [context='JSON'] - Context identifier for logging.
     * @returns {*} The parsed object or the fallback value.
     */
    parse(value, fallback, context = 'JSON') {
        if (value === null || value === undefined || value === '') return fallback;
        if (typeof value !== 'string') return fallback;

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(`Failed to parse ${context}. Using default value.`, error);
            return fallback;
        }
    }
};

/**
 * General Utilities.
 */
export const Utils = {
    /**
     * Debounces a function.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * Deep clones an object.
     * @param {*} obj - The object to clone.
     * @returns {*} The cloned object.
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
};
