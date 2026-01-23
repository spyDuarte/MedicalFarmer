
const DB_NAME = 'PericiaDB';
const DB_VERSION = 1;
const STORE_FILES = 'files';

/**
 * IndexedDB Wrapper for File Storage.
 * Handles large file storage (blobs/base64) separately from LocalStorage.
 */
export const FileDB = {
    /** @type {IDBDatabase|null} */
    db: null,

    /**
     * Initializes the IndexedDB connection.
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('FileDB: Connection failed', event);
                reject(new Error('Failed to open database'));
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

    /**
     * Saves a file to the database.
     * @param {number|string} id - Unique identifier for the file.
     * @param {string|Blob} content - The file content (usually Base64 string).
     * @returns {Promise<number|string>} The saved ID.
     * @throws {Error} If ID is missing or save fails.
     */
    async saveFile(id, content) {
        if (!id) throw new Error('FileDB: ID is required');
        if (!content) throw new Error('FileDB: Content is required');

        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.put({ id, content });

            request.onsuccess = () => resolve(id);
            request.onerror = (e) => {
                console.error('FileDB: Save failed', e);
                reject(new Error('Failed to save file'));
            };
        });
    },

    /**
     * Retrieves a file from the database.
     * @param {number|string} id - The file ID.
     * @returns {Promise<string|Blob|null>} The file content or null if not found.
     */
    async getFile(id) {
        if (!id) return null;
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readonly');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.get(id);

            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result ? result.content : null);
            };
            request.onerror = (e) => {
                console.error('FileDB: Get failed', e);
                reject(new Error('Failed to retrieve file'));
            };
        });
    },

    /**
     * Deletes a file from the database.
     * @param {number|string} id - The file ID.
     * @returns {Promise<void>}
     */
    async deleteFile(id) {
        if (!id) return;
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (e) => {
                console.error('FileDB: Delete failed', e);
                reject(new Error('Failed to delete file'));
            };
        });
    },

    /**
     * Retrieves all files from the database.
     * @returns {Promise<Array<{id: number|string, content: any}>>}
     */
    async getAllFiles() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readonly');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };
            request.onerror = (e) => {
                console.error('FileDB: GetAll failed', e);
                reject(new Error('Failed to retrieve all files'));
            };
        });
    },

    /**
     * Clears all files from the database.
     * @returns {Promise<void>}
     */
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_FILES], 'readwrite');
            const store = transaction.objectStore(STORE_FILES);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (e) => {
                console.error('FileDB: Clear failed', e);
                reject(new Error('Failed to clear database'));
            };
        });
    }
};

// Initialize immediately handled by caller or here
// Swallow errors on auto-init to prevent unhandled rejections if IDB is not available
FileDB.init().catch(err => console.warn('FileDB: Auto-init failed (may occur in non-browser env)', err));
