import { FileDB } from './db.js';
import { DEFAULT_MACROS } from './default_data.js';

const DB_NAME = 'PericiaSysDB';
const DB_VERSION = 1;

export const Storage = {
    db: null,
    state: {
        pericias: [],
        macros: [],
        templates: [],
        settings: {}
    },

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (e) => {
                console.error("Database error", e);
                reject(e.target.error);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pericias')) db.createObjectStore('pericias', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('macros')) db.createObjectStore('macros', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('history')) {
                    const store = db.createObjectStore('history', { keyPath: 'historyId', autoIncrement: true });
                    store.createIndex('periciaId', 'periciaId', { unique: false });
                }
            };

            request.onsuccess = async (e) => {
                this.db = e.target.result;
                try {
                    await this.checkMigration();
                    await this.loadState();
                    resolve();
                } catch (err) {
                    console.error("Error initializing storage:", err);
                    reject(err);
                }
            };
        });
    },

    async checkMigration() {
        // Migration Flag to prevent Zombie Data resurrection
        if (localStorage.getItem('pericia_sys_migrated_v1')) {
            return;
        }

        const lsData = localStorage.getItem('pericia_sys_data');
        if (lsData) {
            const count = await this.count('pericias');
            // Only migrate if IDB is empty to avoid overwriting new data
            if (count === 0) {
                console.log("Migrating from LocalStorage...");
                const p = JSON.parse(lsData || '[]');
                const m = JSON.parse(localStorage.getItem('pericia_sys_macros') || JSON.stringify(DEFAULT_MACROS));
                const t = JSON.parse(localStorage.getItem('pericia_sys_templates') || '[]');
                const s = JSON.parse(localStorage.getItem('pericia_sys_settings') || '{}');

                for (const item of p) await this.put('pericias', item);
                for (const item of m) await this.put('macros', item);
                for (const item of t) await this.put('templates', item);
                await this.put('settings', { key: 'main', value: s });

                // Mark migration as done
                localStorage.setItem('pericia_sys_migrated_v1', 'true');
            }
        } else {
            // Fresh install check
            const count = await this.count('macros');
            if (count === 0) {
                 for (const item of DEFAULT_MACROS) await this.put('macros', item);
            }
        }
    },

    async loadState() {
        this.state.pericias = await this.getAll('pericias');
        this.state.macros = await this.getAll('macros');
        this.state.templates = await this.getAll('templates');
        const s = await this.get('settings', 'main');
        this.state.settings = s ? s.value : {};

        // Ensure settings defaults
        if (!this.state.settings.nome) {
             this.state.settings = {
                nome: "Dr. Perito Judicial",
                crm: "CRM-XX 00000",
                endereco: "",
                telefone: ""
            };
            await this.saveSettings(this.state.settings);
        }
    },

    // --- Generic IDB Helpers ---
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async put(storeName, value) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async delete(storeName, key) {
         return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async count(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    // --- Public API (Sync Reads, Async Writes) ---
    getPericias() { return this.state.pericias; },
    getPericia(id) { return this.state.pericias.find(p => p.id == id); },

    async savePericia(pericia) {
        if (!pericia.id) {
            pericia.id = Date.now();
            pericia.created_at = new Date().toISOString();
        } else {
             // History: Save snapshot before update
             const old = this.getPericia(pericia.id);
             if (old) {
                 await this.saveHistory(old);
             }
        }

        // Update State
        const idx = this.state.pericias.findIndex(p => p.id == pericia.id);
        if (idx >= 0) this.state.pericias[idx] = pericia;
        else this.state.pericias.push(pericia);

        // Persist
        try {
            await this.put('pericias', pericia);
        } catch (e) {
            console.error("Error saving pericia:", e);
            throw e;
        }
        return pericia;
    },

    async deletePericia(id) {
        this.state.pericias = this.state.pericias.filter(p => p.id != id);
        await this.delete('pericias', parseInt(id));
    },

    // --- Macros ---
    getMacros() { return this.state.macros; },
    async addMacro(macro) {
        macro.id = Date.now();
        this.state.macros.push(macro);
        await this.put('macros', macro);
    },
    async deleteMacro(id) {
        this.state.macros = this.state.macros.filter(m => m.id != id);
        await this.delete('macros', parseInt(id));
    },

    // --- Templates ---
    getTemplates() { return this.state.templates; },
    async addTemplate(template) {
        template.id = Date.now();
        this.state.templates.push(template);
        await this.put('templates', template);
    },
    async deleteTemplate(id) {
         this.state.templates = this.state.templates.filter(t => t.id != id);
         await this.delete('templates', parseInt(id));
    },

    // --- Settings ---
    getSettings() { return this.state.settings; },
    async saveSettings(settings) {
        this.state.settings = settings;
        await this.put('settings', { key: 'main', value: settings });
    },

    // --- Drafts (Async) ---
    async saveDraft(data) {
        await this.put('drafts', { key: 'current_draft', data });
    },
    async getDraft() {
        const res = await this.get('drafts', 'current_draft');
        return res ? res.data : null;
    },
    async clearDraft() {
        await this.delete('drafts', 'current_draft');
    },

    // --- History (Async) ---
    async saveHistory(pericia) {
        // Deep copy to avoid reference issues
        const copy = JSON.parse(JSON.stringify(pericia));
        await this.put('history', {
            periciaId: pericia.id,
            timestamp: new Date().toISOString(),
            data: copy
        });
    },
    async getHistory(periciaId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readonly');
            const store = tx.objectStore('history');
            const index = store.index('periciaId');
            const req = index.getAll(IDBKeyRange.only(parseInt(periciaId)));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    // --- Backup & Restore ---
    async exportData() {
        // Collect data from state (Sync)
        let data = {
            pericias: this.state.pericias,
            macros: this.state.macros,
            settings: this.state.settings,
            templates: this.state.templates,
            exportDate: new Date().toISOString()
        };

        // Collect IndexedDB files (Async)
        try {
            const files = await FileDB.getAllFiles();
            data.files = files;
        } catch (e) {
            console.error("Error exporting files:", e);
            alert("Aviso: Não foi possível exportar os anexos.");
        }

        let jsonString = JSON.stringify(data, null, 2);
        let filename = `backup_pericias_${new Date().toISOString().slice(0,10)}.json`;

        const password = prompt("Deseja proteger o backup com senha? (Deixe em branco para não criptografar)");
        if (password) {
            try {
                if (window.CryptoJS) {
                    const encrypted = window.CryptoJS.AES.encrypt(jsonString, password).toString();
                    jsonString = encrypted;
                    filename += ".enc";
                } else {
                    alert("Biblioteca de criptografia não carregada.");
                    return;
                }
            } catch (e) {
                console.error(e);
                alert("Erro ao criptografar.");
                return;
            }
        }

        const blob = new Blob([jsonString], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importData(input) {
        const file = input.files[0];
        if(!file) return;

        if(!confirm("ATENÇÃO: Isso irá substituir todos os dados atuais pelos do backup. Deseja continuar?")) {
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let content = e.target.result;
                let data;

                if (file.name.endsWith('.enc') || !content.trim().startsWith('{')) {
                    const password = prompt("Este backup está criptografado. Digite a senha:");
                    if (!password) return;
                    try {
                         if (window.CryptoJS) {
                            const bytes = window.CryptoJS.AES.decrypt(content, password);
                            const decryptedData = bytes.toString(window.CryptoJS.enc.Utf8);
                            if (!decryptedData) throw new Error("Senha incorreta");
                            data = JSON.parse(decryptedData);
                         } else {
                             throw new Error("Lib CryptoJS missing");
                         }
                    } catch (err) {
                        alert("Falha na descriptografia: Senha incorreta ou arquivo corrompido.");
                        return;
                    }
                } else {
                    data = JSON.parse(content);
                }

                // Restore to IDB
                await this.db.transaction('pericias', 'readwrite').objectStore('pericias').clear();
                await this.db.transaction('macros', 'readwrite').objectStore('macros').clear();
                await this.db.transaction('templates', 'readwrite').objectStore('templates').clear();
                await this.db.transaction('settings', 'readwrite').objectStore('settings').clear();

                if(data.pericias) for(const p of data.pericias) await this.put('pericias', p);
                if(data.macros) for(const m of data.macros) await this.put('macros', m);
                if(data.templates) for(const t of data.templates) await this.put('templates', t);
                if(data.settings) await this.put('settings', { key: 'main', value: data.settings });

                if(data.files && Array.isArray(data.files)) {
                    await FileDB.clear();
                    for(const file of data.files) {
                        await FileDB.saveFile(file.id, file.content);
                    }
                }

                alert("Dados restaurados com sucesso!");
                location.reload();
            } catch (err) {
                console.error(err);
                alert("Erro ao restaurar backup. Verifique o arquivo.");
            }
        };
        reader.readAsText(file);
    }
};
