import time
from playwright.sync_api import sync_playwright

def verify_storage_corrected():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for app to load (Storage.init happens on load)
        page.wait_for_load_state("networkidle")
        time.sleep(2) # Extra buffer for async init

        # Check if DB is created
        print("Checking IndexedDB...")
        # Evaluate JS to check IDB
        db_exists = page.evaluate("""
            (async () => {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('PericiaSysDB', 1);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        const stores = Array.from(db.objectStoreNames);
                        db.close();
                        resolve(stores);
                    };
                    req.onerror = () => resolve([]);
                });
            })()
        """)

        print(f"Stores found: {db_exists}")
        expected_stores = ['drafts', 'history', 'macros', 'pericias', 'settings', 'templates']
        if all(s in db_exists for s in expected_stores):
            print("SUCCESS: All IndexedDB stores created.")
        else:
            print("FAILURE: Missing stores.")

        # Test Saving a Pericia (History trigger) using the new global name
        print("Testing Save Pericia via AppStorage...")
        page.evaluate("""
            (async () => {
                const p = { nome_autor: 'Teste Playwright Fixed', status: 'Aguardando' };
                await AppStorage.savePericia(p);
            })()
        """)

        # Verify it's in IDB
        pericias = page.evaluate("AppStorage.getPericias()")
        print(f"Pericias in Cache: {len(pericias)}")

        browser.close()

if __name__ == "__main__":
    verify_storage_corrected()
