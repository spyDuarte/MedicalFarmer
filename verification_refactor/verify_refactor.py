
from playwright.sync_api import sync_playwright

def verify_refactor():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:3000/")

        # Wait for the app to initialize (window.App should be present)
        page.wait_for_function("typeof window.App !== 'undefined'")

        # Check if styles are applied
        # We can check if the tab button has the correct padding which was 1rem (16px)
        # .tab-btn class: padding-left: 1rem (16px)

        # Click on 'Nova Perícia' to ensure routing works
        page.click('a[href="#nova"]')

        # Wait for the view-form to be visible
        page.wait_for_selector("#view-form:not(.hidden)")

        # Take a screenshot
        page.screenshot(path="verification_refactor/screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_refactor()
