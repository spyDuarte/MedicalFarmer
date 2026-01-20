from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the dashboard
        page.goto("http://localhost:3000")

        # Wait for dashboard to load (checking for stats grid)
        page.wait_for_selector("#view-dashboard")

        # Screenshot the Dashboard with new Cards
        page.screenshot(path="verification/dashboard_cards.png")
        print("Dashboard screenshot taken.")

        # Open Mobile Menu (to check aria-expanded and footer visibility)
        # Note: We need to resize viewport to trigger mobile view
        page.set_viewport_size({"width": 375, "height": 667})

        # Screenshot Mobile View (Footer should be visible at bottom)
        page.screenshot(path="verification/mobile_view.png")
        print("Mobile view screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_changes()
