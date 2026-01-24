from playwright.sync_api import sync_playwright

def verify_structure():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        print("Navigating to app...")
        page.goto("http://localhost:3000/")

        print("Waiting for Dashboard View to be visible...")
        # Wait for the view-dashboard to not have class 'hidden'
        try:
            page.wait_for_selector("#view-dashboard:not(.hidden)", timeout=5000)
            print("Dashboard is visible.")
        except Exception as e:
            print(f"Error waiting for dashboard: {e}")
            # print html content for debugging
            # print(page.content())

        # 2. Check Dashboard Table Sorting Accessibility
        print("Checking aria-sort...")
        try:
            # Wait for table headers, not body (body might be empty/invisible)
            page.wait_for_selector(".sortable", timeout=5000)
            headers = page.locator(".sortable")
            count = headers.count()
            assert count > 0, "No sortable headers found"

            first_header = headers.first
            assert first_header.get_attribute("aria-sort") is not None, "aria-sort attribute missing"

            # Click to sort
            print("Testing sort interaction...")
            first_header.click()
            page.wait_for_timeout(1000)
            sort_attr = first_header.get_attribute("aria-sort")
            print(f"Sort attribute after click: {sort_attr}")
            assert sort_attr in ["ascending", "descending"], f"aria-sort should be asc/desc, got {sort_attr}"
        except Exception as e:
            print(f"Sorting check failed: {e}")

        # 3. Check Form Module and Annotations
        print("Navigating to Form...")
        page.click('a[href="#nova"]')
        try:
            page.wait_for_selector("#view-form:not(.hidden)", timeout=5000)
            # Verify Annotation Modal Buttons exist
            assert page.locator("#btn-annotate-pen").count() > 0
            print("Form navigation and annotation button check successful.")
        except Exception as e:
            print(f"Form navigation failed: {e}")

        # Ensure directory exists
        import os
        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/verification.png")
        print("Screenshot saved to tests/screenshots/verification.png")

        browser.close()

if __name__ == "__main__":
    verify_structure()
