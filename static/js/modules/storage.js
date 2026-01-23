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
    },

    /**
     * Migrates existing data from snake_case to camelCase.
     */
    migrateData() {
        try {
            const raw = localStorage.getItem(DB_KEYS.PERICIAS);
            if (!raw) return;
            let pericias = JSONUtils.parse(raw, [], 'perícias');
            if (!Array.isArray(pericias)) return;
            let modified = false;

            pericias = pericias.map(p => {
                // Check if it's an old record (has snake_case keys)
                if (p.numero_processo || p.nome_autor || p.tipo_acao) {
                    modified = true;
                    // The Pericia constructor handles the mapping from snake_case to camelCase
                    const newModel = new Pericia(p);
                    // Return the plain object, not the class instance, to avoid serialization issues?
                    // Class instance stringifies fine usually.
                    return { ...newModel };
                }
                return p;
            });

            if (modified) {
                console.info("Migrating data to CamelCase standards...");
                localStorage.setItem(DB_KEYS.PERICIAS, JSON.stringify(pericias));
            }
        } catch (e) {
            console.error("Migration failed", e);
        }
    },

    // --- Pericias ---

    /**
     * Retrieves all pericias from storage.
     * @returns {Array} List of pericias.
     */
    getPericias() {
        const list = JSONUtils.parse(localStorage.getItem(DB_KEYS.PERICIAS), [], 'perícias');
        if (!Array.isArray(list)) return [];
        // Ensure they are proper objects (in case migration didn't run or new fields added)
        return list.map(p => new Pericia(p));
    },

    /**
     * Retrieves a single pericia by ID.
     * @param {number|string} id - The ID of the pericia.
     * @returns {Object|undefined} The pericia object or undefined.
     */
    getPericia(id) {
        const pericias = this.getPericias();
        return pericias.find(p => p.id == id);
    },

    /**
     * Saves or updates a pericia.
     * @param {Object} pericia - The pericia object.
     * @returns {Object} The saved pericia.
     */
    savePericia(pericia) {
        // Ensure we are saving the Clean Model
        const model = new Pericia(pericia);
        const pericias = this.getPericias();

        if (model.id) {
            const index = pericias.findIndex(p => p.id == model.id);
            if (index !== -1) {
                pericias[index] = model; // Update
            } else {
                pericias.push(model); // Should not happen often if ID exists
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
                throw new Error('Limite de armazenamento excedido! Tente remover arquivos anexados.');
            }
            throw e;
        }
        return model;
    },

    /**
     * Deletes a pericia by ID.
     * @param {number|string} id - The ID of the pericia.
     */
    deletePericia(id) {
        let pericias = this.getPericias();
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
         macros = macros.filter(m => m.id != id);
         localStorage.setItem(DB_KEYS.MACROS, JSON.stringify(macros));
    },

    // --- Settings ---

    /**
     * Retrieves application settings.
     * @returns {Object} Settings object.
     */
    getSettings() {
        const settings = JSONUtils.parse(localStorage.getItem(DB_KEYS.SETTINGS), {}, 'configurações');
        return settings && typeof settings === 'object' ? settings : {};
    },

    /**
     * Saves application settings.
     * @param {Object} settings - The settings object.
     */
    saveSettings(settings) {
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // --- Templates ---

    /**
     * Retrieves all templates.
     * @returns {Array} List of templates.
     */
    getTemplates() {
        const templates = JSONUtils.parse(localStorage.getItem(DB_KEYS.TEMPLATES), [], 'modelos');
        return Array.isArray(templates) ? templates : [];
    },

    /**
     * Adds a new template.
     * @param {Object} template - The template object.
     */
    addTemplate(template) {
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
        templates = templates.filter(t => t.id != id);
        localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(templates));
    },

    // --- Backup & Restore ---

    /**
     * Generates a backup object containing all data.
     * @param {string|null} password - Optional password for encryption.
     * @returns {Promise<{filename: string, content: string}>} The backup data.
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
            throw new Error("Não foi possível exportar os anexos.");
        }

        let jsonString = JSON.stringify(data, null, 2);
        let filename = `backup_pericias_${new Date().toISOString().slice(0,10)}.json`;

        if (password) {
            if (window.CryptoJS) {
                const encrypted = window.CryptoJS.AES.encrypt(jsonString, password).toString();
                jsonString = encrypted;
                filename += ".enc";
            } else {
                throw new Error("Biblioteca de criptografia não carregada.");
            }
        }

        return { filename, content: jsonString };
    },

    /**
     * Restores data from a backup string.
     * @param {string} content - The JSON string (or encrypted string).
     * @param {string|null} password - Password for decryption.
     * @returns {Promise<boolean>} True if successful.
     */
    async processImportData(content, password = null) {
        let data;

        try {
            // First try JSON parse
            data = JSON.parse(content);
        } catch (e) {
            // If failed, maybe it's encrypted
            if (password && window.CryptoJS) {
                try {
                    const bytes = window.CryptoJS.AES.decrypt(content, password);
                    const decryptedData = bytes.toString(window.CryptoJS.enc.Utf8);
                    if (!decryptedData) throw new Error("Senha incorreta");
                    data = JSON.parse(decryptedData);
                } catch (decryptError) {
                    throw new Error("Falha na descriptografia: Senha incorreta ou arquivo corrompido.");
                }
            } else {
                if (!password) throw new Error("Arquivo parece criptografado ou inválido, mas nenhuma senha foi fornecida.");
                 throw new Error("Falha ao ler arquivo: " + e.message);
            }
        }

        // Validate structure
        if (!data.pericias && !data.settings) throw new Error("Arquivo de backup inválido.");

        // Restore LocalStorage
        // Note: Imported data might be in old format. We save it as is, and let 'migrateData' handle it on reload,
        // OR we migrate it right now.
        // Let's rely on 'init()' calling migrateData() on reload, but to be safe, we can run migration here if we wanted.
        // But since 'init' runs on page load, and we reload page after import (in app.js), it should be fine.

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

Storage.init();
