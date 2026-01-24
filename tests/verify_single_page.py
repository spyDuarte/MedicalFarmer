from playwright.sync_api import sync_playwright

def verify_single_page_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000/#nova")

        # Wait for form to load
        page.wait_for_selector("#view-form:not(.hidden)")
        print("Form loaded.")

        # Check if all sections are visible (not hidden by tabs)
        sections = [
            "section-identificacao",
            "section-historico",
            "section-exame",
            "section-conclusao",
            "section-quesitos"
        ]

        for sec in sections:
            # We check if the element exists and is visible (not hidden via display:none)
            # Since they are in a scrolling container, is_visible() checks active visibility,
            # but we mainly want to ensure no 'hidden' class or style that tabs would use.

            # Actually, standard is_visible() returns true even if off-screen (scrolled out),
            # provided it has size and no display:none.
            is_vis = page.locator(f"#{sec}").is_visible()
            print(f"Section {sec} visible: {is_vis}")
            assert is_vis, f"Section {sec} should be visible"

        # Check TOC links
        toc_links = page.locator("#form-toc a")
        print(f"Found {toc_links.count()} TOC links")
        assert toc_links.count() == 5, "Should have 5 TOC links"

        # Take a screenshot
        import os
        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/single_page_form.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_single_page_form()
