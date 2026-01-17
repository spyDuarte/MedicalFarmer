import { FileDB } from './db.js';
import { DEFAULT_MACROS } from './default_data.js';

const DB_KEY = 'pericia_sys_data';
const MACROS_KEY = 'pericia_sys_macros';
const SETTINGS_KEY = 'pericia_sys_settings';
const TEMPLATES_KEY = 'pericia_sys_templates';

export const Storage = {
    // --- Data Initialization ---
    init() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(TEMPLATES_KEY)) {
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(MACROS_KEY)) {
            localStorage.setItem(MACROS_KEY, JSON.stringify(DEFAULT_MACROS));
        }
        if (!localStorage.getItem(SETTINGS_KEY)) {
            const defaultSettings = {
                nome: "Dr. Perito Judicial",
                crm: "CRM-XX 00000",
                endereco: "",
                telefone: ""
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        }
    },

    // --- Pericias ---
    getPericias() {
        return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    },

    getPericia(id) {
        const pericias = this.getPericias();
        return pericias.find(p => p.id == id);
    },

    savePericia(pericia) {
        const pericias = this.getPericias();
        if (pericia.id) {
            const index = pericias.findIndex(p => p.id == pericia.id);
            if (index !== -1) {
                pericias[index] = { ...pericias[index], ...pericia }; // Update
            }
        } else {
            pericia.id = Date.now(); // Simple ID
            pericia.created_at = new Date().toISOString();
            pericias.push(pericia);
        }
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(pericias));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                throw new Error('Limite de armazenamento excedido! Tente remover arquivos anexados.');
            }
            throw e;
        }
        return pericia;
    },

    deletePericia(id) {
        let pericias = this.getPericias();
        pericias = pericias.filter(p => p.id != id);
        localStorage.setItem(DB_KEY, JSON.stringify(pericias));
    },

    // --- Macros ---
    getMacros() {
        return JSON.parse(localStorage.getItem(MACROS_KEY) || '[]');
    },

    addMacro(macro) {
        const macros = this.getMacros();
        macro.id = Date.now();
        macros.push(macro);
        localStorage.setItem(MACROS_KEY, JSON.stringify(macros));
    },

    deleteMacro(id) {
         let macros = this.getMacros();
         macros = macros.filter(m => m.id != id);
         localStorage.setItem(MACROS_KEY, JSON.stringify(macros));
    },

    // --- Settings ---
    getSettings() {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    },

    saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },

    // --- Templates ---
    getTemplates() {
        return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
    },

    addTemplate(template) {
        const templates = this.getTemplates();
        template.id = Date.now();
        templates.push(template);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    },

    deleteTemplate(id) {
        let templates = this.getTemplates();
        templates = templates.filter(t => t.id != id);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    },

    // --- Backup & Restore ---
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
            console.error("Error exporting files:", e);
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

    async processImportData(content, password = null) {
        let data;

        // Check if potentially encrypted
        // Naive check: if it doesn't start with '{', it's likely not plain JSON
        // Or check file extension in caller.
        // Here we just try to parse or decrypt.

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
        if(data.pericias) localStorage.setItem(DB_KEY, JSON.stringify(data.pericias));
        if(data.macros) localStorage.setItem(MACROS_KEY, JSON.stringify(data.macros));
        if(data.templates) localStorage.setItem(TEMPLATES_KEY, JSON.stringify(data.templates));
        if(data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));

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
