
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
