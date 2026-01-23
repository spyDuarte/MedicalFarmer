import { FileDB } from './db.js';
import { DEFAULT_MACROS, DEFAULT_TEMPLATES } from './default_data.js';
import { DB_KEYS } from './constants.js';
import { Pericia } from './models.js';
import { JSONUtils } from './utils.js';

/**
 * Storage module for handling LocalStorage and IndexedDB interactions.
 */
export const Storage = {
    /**
     * Initializes the storage with default data if empty.
     */
    init() {
        try {
            if (!localStorage.getItem(DB_KEYS.PERICIAS)) {
                localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify([]));
            }
            if (!localStorage.getItem(DB_KEYS.TEMPLATES)) {
                localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
            }
            if (!localStorage.getItem(DB_KEYS.MACROS)) {
                localStorage.setItem(DB_KEYS.MACROS, JSON.stringify(DEFAULT_MACROS));
            }
            if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
                const defaultSettings = {
                    nome: "Dr. Perito Judicial",
                    crm: "CRM-XX 00000",
                    endereco: "",
                    telefone: ""
                };
                localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(defaultSettings));
            }

            this.migrateData();
        } catch (error) {
            console.error('Storage: Init failed', error);
        }
    },

    /**
     * Migrates existing data from snake_case to camelCase.
     */
    migrateData() {
        try {
            const raw = localStorage.getItem(DB_KEYS.PERICIAS);
            if (!raw) return;
            let pericias = JSONUtils.parse(raw, [], 'pericias');
            if (!Array.isArray(pericias)) return;
            let modified = false;

            pericias = pericias.map(p => {
                // Check if it's an old record (has snake_case keys)
                if (p.numero_processo || p.nome_autor || p.tipo_acao) {
                    modified = true;
                    // The Pericia constructor handles the mapping from snake_case to camelCase
                    const newModel = new Pericia(p);
                    // Return the plain object, not the class instance
                    return { ...newModel };
                }
                return p;
            });

            if (modified) {
                console.info("Storage: Migrating data to CamelCase standards...");
                localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify(pericias));
            }
        } catch (e) {
            console.error("Storage: Migration failed", e);
        }
    },

    // --- Pericias ---

    /**
     * Retrieves all pericias from storage.
     * @returns {Array} List of pericias.
     */
    getPericias() {
        const list = JSONUtils.parse(localStorage.getItem(DB_KEYS.PERICIAS), [], 'pericias');
        if (!Array.isArray(list)) return [];
        // Ensure they are proper objects
        return list.map(p => new Pericia(p));
    },

    /**
     * Retrieves a single pericia by ID.
     * @param {number|string} id - The ID of the pericia.
     * @returns {Object|undefined} The pericia object or undefined.
     */
    getPericia(id) {
        const pericias = this.getPericias();
        // eslint-disable-next-line eqeqeq
        return pericias.find(p => p.id == id);
    },

    /**
     * Saves or updates a pericia.
     * @param {Object} pericia - The pericia object.
     * @returns {Object} The saved pericia.
     * @throws {Error} If quota exceeded or invalid data.
     */
    savePericia(pericia) {
        if (!pericia) throw new Error('Pericia data is required');

        // Ensure we are saving the Clean Model
        const model = new Pericia(pericia);
        const pericias = this.getPericias();

        if (model.id) {
            // eslint-disable-next-line eqeqeq
            const index = pericias.findIndex(p => p.id == model.id);
            if (index !== -1) {
                pericias[index] = model; // Update
            } else {
                pericias.push(model);
            }
        } else {
            model.id = Date.now();
            model.createdAt = new Date().toISOString();
            pericias.push(model);
        }

        try {
            localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify(pericias));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                throw new Error('Storage limit exceeded! Try removing attached files.');
            }
            console.error('Storage: Save failed', e);
            throw new Error('Failed to save pericia');
        }
        return model;
    },

    /**
     * Deletes a pericia by ID.
     * @param {number|string} id - The ID of the pericia.
     */
    deletePericia(id) {
        let pericias = this.getPericias();
        // eslint-disable-next-line eqeqeq
        pericias = pericias.filter(p => p.id != id);
        localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify(pericias));
    },

    // --- Macros ---

    /**
     * Retrieves all macros.
     * @returns {Array} List of macros.
     */
    getMacros() {
        const macros = JSONUtils.parse(localStorage.getItem(DB_KEYS.MACROS), [], 'macros');
        return Array.isArray(macros) ? macros : [];
    },

    /**
     * Adds a new macro.
     * @param {Object} macro - The macro object.
     */
    addMacro(macro) {
        if (!macro || !macro.titulo || !macro.conteudo) return;
        const macros = this.getMacros();
        macro.id = Date.now();
        macros.push(macro);
        localStorage.setItem(DB_KEYS.MACROS, JSON.stringify(macros));
    },

    /**
     * Deletes a macro by ID.
     * @param {number|string} id - The ID of the macro.
     */
    deleteMacro(id) {
         let macros = this.getMacros();
         // eslint-disable-next-line eqeqeq
         macros = macros.filter(m => m.id != id);
         localStorage.setItem(DB_KEYS.MACROS, JSON.stringify(macros));
    },

    // --- Settings ---

    /**
     * Retrieves application settings.
     * @returns {Object} Settings object.
     */
    getSettings() {
        const settings = JSONUtils.parse(localStorage.getItem(DB_KEYS.SETTINGS), {}, 'settings');
        return settings && typeof settings === 'object' ? settings : {};
    },

    /**
     * Saves application settings.
     * @param {Object} settings - The settings object.
     */
    saveSettings(settings) {
        if (!settings) return;
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // --- Templates ---

    /**
     * Retrieves all templates.
     * @returns {Array} List of templates.
     */
    getTemplates() {
        const templates = JSONUtils.parse(localStorage.getItem(DB_KEYS.TEMPLATES), [], 'templates');
        return Array.isArray(templates) ? templates : [];
    },

    /**
     * Adds a new template.
     * @param {Object} template - The template object.
     */
    addTemplate(template) {
        if (!template || !template.title || !template.data) return;
        const templates = this.getTemplates();
        template.id = Date.now();
        templates.push(template);
        localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(templates));
    },

    /**
     * Deletes a template by ID.
     * @param {number|string} id - The ID of the template.
     */
    deleteTemplate(id) {
        let templates = this.getTemplates();
        // eslint-disable-next-line eqeqeq
        templates = templates.filter(t => t.id != id);
        localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(templates));
    },

    // --- Backup & Restore ---

    /**
     * Generates a backup object containing all data.
     * @param {string|null} [password=null] - Optional password for encryption.
     * @returns {Promise<{filename: string, content: string}>} The backup data.
     * @throws {Error} If encryption fails or file export fails.
     */
    async getExportData(password = null) {
        // Collect local storage data
        let data = {
            pericias: this.getPericias(),
            macros: this.getMacros(),
            settings: this.getSettings(),
            templates: this.getTemplates(),
            exportDate: new Date().toISOString()
        };

        // Collect IndexedDB files
        try {
            const files = await FileDB.getAllFiles();
            data.files = files; // Array of {id, content}
        } catch (e) {
            console.error(e);
            throw new Error("Failed to export attachments.");
        }

        let jsonString = JSON.stringify(data, null, 2);
        let filename = `backup_pericias_${new Date().toISOString().slice(0,10)}.json`;

        if (password) {
            // eslint-disable-next-line no-undef
            if (typeof window !== 'undefined' && window.CryptoJS) {
                // eslint-disable-next-line no-undef
                const encrypted = window.CryptoJS.AES.encrypt(jsonString, password).toString();
                jsonString = encrypted;
                filename += ".enc";
            } else {
                throw new Error("Encryption library not loaded.");
            }
        }

        return { filename, content: jsonString };
    },

    /**
     * Restores data from a backup string.
     * @param {string} content - The JSON string (or encrypted string).
     * @param {string|null} [password=null] - Password for decryption.
     * @returns {Promise<boolean>} True if successful.
     * @throws {Error} If decryption fails or data is invalid.
     */
    async processImportData(content, password = null) {
        let data;

        try {
            // First try JSON parse
            data = JSON.parse(content);
        } catch (e) {
            // If failed, maybe it's encrypted
            // eslint-disable-next-line no-undef
            if (password && typeof window !== 'undefined' && window.CryptoJS) {
                try {
                    // eslint-disable-next-line no-undef
                    const bytes = window.CryptoJS.AES.decrypt(content, password);
                    // eslint-disable-next-line no-undef
                    const decryptedData = bytes.toString(window.CryptoJS.enc.Utf8);
                    if (!decryptedData) throw new Error("Incorrect password");
                    data = JSON.parse(decryptedData);
                } catch (decryptError) {
                    throw new Error("Decryption failed: Incorrect password or corrupted file.");
                }
            } else {
                if (!password) throw new Error("File appears encrypted or invalid, but no password was provided.");
                 throw new Error("Failed to read file: " + e.message);
            }
        }

        // Validate structure
        if (!data || (!data.pericias && !data.settings)) throw new Error("Invalid backup file.");

        // Restore LocalStorage
        if(data.pericias) localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify(data.pericias));
        if(data.macros) localStorage.setItem(DB_KEYS.MACROS, JSON.stringify(data.macros));
        if(data.templates) localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(data.templates));
        if(data.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(data.settings));

        // Restore IndexedDB
        if(data.files && Array.isArray(data.files)) {
            await FileDB.clear();
            for(const file of data.files) {
                await FileDB.saveFile(file.id, file.content);
            }
        }

        return true;
    }
};

// Initialize handled by app.js primarily, but safe to call here if side-effects controlled
Storage.init();
