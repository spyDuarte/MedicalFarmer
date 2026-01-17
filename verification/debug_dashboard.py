
from playwright.sync_api import sync_playwright

def verify_dashboard_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Navigate
        page.goto("http://localhost:3000/#dashboard")

        # Wait a bit to see if logs appear
        page.wait_for_timeout(2000)

        # Check visibility
        if page.is_visible("#view-dashboard"):
            print("Dashboard is visible")
        else:
            print("Dashboard is HIDDEN")

        page.screenshot(path="verification/debug.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard_load()
