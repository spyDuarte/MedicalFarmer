
const DB_NAME = 'PericiaDB';
const DB_VERSION = 1;
const STORE_FILES = 'files';

const FileDB = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_FILES)) {
                    db.createObjectStore(STORE_FILES, { keyPath: 'id' });
                }
            };
        });
    },

    async saveFile(id, content) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.put({ id, content });

            request.onsuccess = () => resolve(id);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getFile(id) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readonly');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.get(id);

            request.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.content : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteFile(id) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getAllFiles() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readonly');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async clear() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }
};

// Initialize immediately
FileDB.init().catch(console.error);
