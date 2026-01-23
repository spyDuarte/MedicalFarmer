import time
from playwright.sync_api import sync_playwright

def test_refactor_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        import os
        cwd = os.getcwd()
        page.goto(f"file://{os.path.join(cwd, 'frontend', 'index.html')}")

        # 1. Navigation Check (Router Module)
        print("Checking Dashboard Load...")
        page.wait_for_selector("text=Dashboard")

        # 2. Financial View Check (New Module)
        print("Checking Finance View...")
        page.click("a[href='#financeiro']")
        time.sleep(0.5)

        # Check for charts and values
        page.wait_for_selector("text=Relatório Financeiro")
        page.wait_for_selector("#chart-finance-status")
        page.wait_for_selector("#fin-total-paid")

        print("Finance view loaded.")
        page.screenshot(path="tests/screenshots/finance_view.png")

        # 3. Macro Loading (Default Data Module)
        print("Checking Macros...")
        page.click("a[href='#macros']")
        time.sleep(0.5)

        # Should see default macros from default_data.js
        page.wait_for_selector("text=Anamnese - Dor Lombar")
        page.wait_for_selector("text=Exame Físico - Coluna Lombar")

        print("Default macros confirmed.")
        page.screenshot(path="tests/screenshots/macros_view.png")

        # 4. Form & PDF (Existing features regression test)
        print("Checking Form & PDF...")
        page.click("a[href='#nova']")
        page.fill("#f-numero_processo", "REFACTOR-TEST")
        page.fill("#f-nome_autor", "Teste Refactor")

        # Save
        page.keyboard.press("Control+s")
        # Handle alert
        # In the new code, saveForm uses alert(). Playwright auto-dismisses alerts but we can catch dialog
        def handle_dialog(dialog):
            print(f"Dialog: {dialog.message}")
            dialog.accept()

        page.on("dialog", handle_dialog)

        # Force Concluded to check print
        page.evaluate("""() => {
             const list = JSON.parse(localStorage.getItem('pericia_sys_data'));
             const p = list[list.length-1];
             p.status = 'Concluido';
             localStorage.setItem('pericia_sys_data', JSON.stringify(list));
        }""")

        page.reload()
        page.click("a[href='#dashboard']")
        time.sleep(0.5)

        print_btn = page.locator("a[href^='#print/']").first
        if print_btn.count() > 0:
            print_btn.click()
            time.sleep(0.5)
            page.wait_for_selector("#view-print:not(.hidden)")
            print("Print view loaded.")
        else:
            print("Print button not found.")

        browser.close()

if __name__ == "__main__":
    test_refactor_features()
