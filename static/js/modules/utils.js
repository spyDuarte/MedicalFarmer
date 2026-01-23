
/**
 * Utility for Input Masking.
 */
export const Mask = {
    /**
     * Masks a value as CPF (000.000.000-00).
     * @param {string} value
     * @returns {string} Masked CPF.
     */
    cpf(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    /**
     * Masks a value as CNPJ (00.000.000/0000-00).
     * @param {string} value
     * @returns {string} Masked CNPJ.
     */
    cnpj(value) {
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
     * @param {string} value
     * @returns {string} Masked CEP.
     */
    cep(value) {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },

    /**
     * Masks a value as Phone ( (00) 00000-0000 ).
     * @param {string} value
     * @returns {string} Masked Phone.
     */
    phone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    /**
     * Masks a value as Currency (0.00).
     * @param {string} value
     * @returns {string} Formatted currency string.
     */
    currency(value) {
        let v = value.replace(/\D/g, '');
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
     * @param {string} cpf
     * @returns {boolean} True if valid.
     */
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
    },

    /**
     * Validates a CNPJ number.
     * @param {string} cnpj
     * @returns {boolean} True if valid.
     */
    cnpj(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');
        if(cnpj === '') return false;
        if (cnpj.length !== 14) return false;
        // Eliminate known invalid CNPJs
        if (/^(\d)\1+$/.test(cnpj)) return false;

        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0,tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
          soma += numeros.charAt(tamanho - i) * pos--;
          if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0,tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
          soma += numeros.charAt(tamanho - i) * pos--;
          if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1))) return false;

        return true;
    },

    /**
     * Validates an Email address.
     * @param {string} email
     * @returns {boolean} True if valid.
     */
    email(email) {
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
     * @param {string|Date} date
     * @returns {string} Formatted date.
     */
    date(date) {
        if (!date) return '-';
        // Handle ISO strings that might come without time (YYYY-MM-DD)
        // by appending T00:00:00 to prevent timezone offsets shifting the day
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date += 'T00:00:00';
        }
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';

        return new Intl.DateTimeFormat('pt-BR').format(d);
    },

    /**
     * Formats a number as currency (BRL).
     * @param {number|string} value
     * @returns {string} Formatted currency.
     */
    currency(value) {
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
     * @param {string|null|undefined} value
     * @param {*} fallback
     * @param {string} context
     * @returns {*}
     */
    parse(value, fallback, context = 'JSON') {
        if (value === null || value === undefined || value === '') return fallback;
        if (typeof value !== 'string') return fallback;

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(`Falha ao interpretar ${context}. Usando valor padrão.`, error);
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
     * @returns {Function}
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
     * @param {Object} obj
     * @returns {Object}
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
