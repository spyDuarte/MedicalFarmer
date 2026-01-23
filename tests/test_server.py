import time
import subprocess
import sys
from playwright.sync_api import sync_playwright

def test_refactor_features():
    # Start HTTP Server
    server = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], cwd="frontend", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # wait for start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Go to localhost
            page.goto("http://localhost:8000/index.html")

            # Listen to console
            page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

            # 1. Navigation Check
            print("Checking Dashboard Load...")
            page.wait_for_selector("text=Dashboard")

            # 2. Financial View Check
            print("Checking Finance View...")
            page.click("a[href='#financeiro']")
            time.sleep(0.5)

            # Check for charts and values
            page.wait_for_selector("text=Relatório Financeiro")
            # Wait for visibility explicitly
            page.wait_for_selector("#view-finance:not(.hidden)")

            print("Finance view loaded.")
            page.screenshot(path="tests/screenshots/finance_view.png")

            # 3. Macro Loading
            print("Checking Macros...")
            page.click("a[href='#macros']")
            time.sleep(0.5)

            page.wait_for_selector("text=Anamnese - Dor Lombar")
            print("Default macros confirmed.")
            page.screenshot(path="tests/screenshots/macros_view.png")

            # 4. Form & PDF
            print("Checking Form...")
            page.click("a[href='#nova']")
            page.fill("#f-numero_processo", "REFACTOR-TEST")

            # Handle alert
            page.on("dialog", lambda d: d.accept())

            page.keyboard.press("Control+s")
            time.sleep(1)

            print("Form saved.")

    finally:
        server.terminate()

if __name__ == "__main__":
    test_refactor_features()
