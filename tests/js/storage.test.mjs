
// --- Mocks Setup ---

// Mock LocalStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        removeItem: function(key) {
            delete store[key];
        },
        clear: function() {
            store = {};
        }
    };
})();
global.localStorage = localStorageMock;

// Mock IndexedDB
const indexedDBMock = (function() {
    const store = new Map();

    const requestMock = (result, error) => {
        const req = {
            result,
            error,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
            triggerSuccess() {
                if(this.onsuccess) this.onsuccess({ target: { result: this.result } });
            },
            triggerError() {
                if(this.onerror) this.onerror({ target: { error: this.error } });
            }
        };
        return req;
    };

    const objectStoreMock = {
        put: (item) => {
            store.set(item.id, item);
            const req = requestMock(item.id);
            setTimeout(() => req.triggerSuccess(), 0);
            return req;
        },
        get: (id) => {
            const req = requestMock({ content: store.get(id)?.content });
            setTimeout(() => req.triggerSuccess(), 0);
            return req;
        },
        delete: (id) => {
            store.delete(id);
            const req = requestMock(undefined);
            setTimeout(() => req.triggerSuccess(), 0);
            return req;
        },
        getAll: () => {
            const req = requestMock(Array.from(store.values()));
            setTimeout(() => req.triggerSuccess(), 0);
            return req;
        },
        clear: () => {
            store.clear();
            const req = requestMock(undefined);
            setTimeout(() => req.triggerSuccess(), 0);
            return req;
        }
    };

    const transactionMock = {
        objectStore: (name) => objectStoreMock
    };

    const dbMock = {
        objectStoreNames: { contains: () => true },
        transaction: (stores, mode) => transactionMock,
        createObjectStore: () => {}
    };

    return {
        open: (name, version) => {
            const req = requestMock(dbMock);
            setTimeout(() => req.triggerSuccess(), 10);
            return req;
        }
    };
})();
global.indexedDB = indexedDBMock;

// Mock Console
const consoleErrors = [];
console.error = (...args) => {
    consoleErrors.push(args);
};
const consoleInfos = [];
console.info = (...args) => { consoleInfos.push(args); };

// --- Test Runner ---

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        console.log(`❌ FAIL: ${message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        passed++;
    } else {
        console.log(`❌ FAIL: ${message}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual:   ${actual}`);
        failed++;
    }
}

async function runTests() {
    console.log('--- Starting Storage & DB Tests ---');

    // Dynamic Import after Mocks
    const { Storage } = await import('../../frontend/static/js/modules/storage.js');
    const { FileDB } = await import('../../frontend/static/js/modules/db.js');

    // Reset State
    localStorage.clear();
    Storage.init();

    // Test Defaults
    const templates = Storage.getTemplates();
    assert(templates.length > 0, 'Storage.init populates defaults');

    // Test Pericia CRUD
    console.log('Testing Pericia CRUD...');
    const p1 = { nomeAutor: 'John Doe', numeroProcesso: '123' };
    const savedP1 = Storage.savePericia(p1);
    assert(savedP1.id > 0, 'savePericia assigns ID');

    const fetchedP1 = Storage.getPericia(savedP1.id);
    assertEqual(fetchedP1.nomeAutor, 'John Doe', 'getPericia retrieves correct data');

    fetchedP1.nomeAutor = 'Jane Doe';
    Storage.savePericia(fetchedP1);
    const updatedP1 = Storage.getPericia(savedP1.id);
    assertEqual(updatedP1.nomeAutor, 'Jane Doe', 'savePericia updates data');

    Storage.deletePericia(savedP1.id);
    const deletedP1 = Storage.getPericia(savedP1.id);
    assert(deletedP1 === undefined, 'deletePericia removes data');

    // Test FileDB
    console.log('Testing FileDB...');
    const fileId = 101;
    const fileContent = 'base64data...';

    try {
        await FileDB.saveFile(fileId, fileContent);
        const retrieved = await FileDB.getFile(fileId);
        assertEqual(retrieved, fileContent, 'FileDB save/get works');

        const all = await FileDB.getAllFiles();
        assertEqual(all.length, 1, 'FileDB getAllFiles works');

        await FileDB.deleteFile(fileId);
        const deleted = await FileDB.getFile(fileId);
        assert(deleted === null || deleted === undefined, 'FileDB delete works');
    } catch (e) {
        console.log('❌ FAIL: FileDB Error', e);
        failed++;
    }

    // Test Backup/Export
    console.log('Testing Export/Import...');
    // Create some data
    Storage.savePericia({ nomeAutor: 'Export Test' });
    const exportData = await Storage.getExportData();
    // Check if valid JSON
    let parsedExport;
    try {
        parsedExport = JSON.parse(exportData.content);
        assert(parsedExport.pericias.length > 0, 'Export generates valid JSON with pericias');
    } catch(e) {
        console.log('❌ FAIL: Export content is not valid JSON');
        failed++;
    }

    // Test Import
    localStorage.clear();
    // Simulate import
    await Storage.processImportData(exportData.content);
    const importedPericias = Storage.getPericias();
    if(importedPericias.length > 0) {
        assertEqual(importedPericias[0].nomeAutor, 'Export Test', 'Import restores data');
    } else {
        console.log('❌ FAIL: Import did not restore data');
        failed++;
    }

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
