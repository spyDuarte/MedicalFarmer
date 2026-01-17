
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
