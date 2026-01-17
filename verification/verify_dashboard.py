
from playwright.sync_api import sync_playwright

def verify_dashboard_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the dashboard
        # Assuming port 3000 is running
        page.goto("http://localhost:3000/#dashboard")

        # Wait for the dashboard to be visible
        page.wait_for_selector("#view-dashboard", state="visible")

        # Take a screenshot
        page.screenshot(path="verification/dashboard_loaded.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard_load()
