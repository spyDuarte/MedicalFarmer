from playwright.sync_api import sync_playwright, expect
import time
import re

def run():
    print("Starting verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to index.html...")
        response = page.goto("http://localhost:3000/index.html")

        # 1. Check CSP
        # Note: http-server might not send CSP header, checking meta tag
        csp_meta = page.locator('meta[http-equiv="Content-Security-Policy"]').get_attribute('content')
        print(f"CSP Meta: {csp_meta}")
        if "script-src 'self'" in csp_meta and "cdn.tailwindcss.com" in csp_meta:
            print("SUCCESS: CSP Meta tag looks correct.")
        else:
            print("FAIL: CSP Meta tag incorrect.")

        # 2. Check Accessibility (Aria Labels)
        inputs_to_check = [
            ("#search-input", "Buscar perícia"),
            ("#status-filter", "Filtrar por Status"),
            ("#date-start", "Data inicial"),
            ("#date-end", "Data final"),
            ("#input-import-backup", "Importar arquivo de backup"),
            ("#upload_document", "Selecionar arquivo para upload")
        ]

        all_a11y_passed = True
        for selector, expected_label in inputs_to_check:
            locator = page.locator(selector)
            if locator.count() > 0:
                label = locator.get_attribute("aria-label")
                if label == expected_label:
                    print(f"SUCCESS: {selector} has correct aria-label: '{label}'")
                else:
                    print(f"FAIL: {selector} has aria-label='{label}', expected '{expected_label}'")
                    all_a11y_passed = False
            else:
                print(f"FAIL: Element {selector} not found.")
                all_a11y_passed = False

        # 3. Check ISO 216 Print Preview
        # Force reveal
        page.evaluate("document.getElementById('view-print').classList.remove('hidden')")
        page.evaluate("document.getElementById('view-print').style.display = 'block'")

        # Check computed styles
        width = page.evaluate("window.getComputedStyle(document.getElementById('view-print')).width")
        padding = page.evaluate("window.getComputedStyle(document.getElementById('view-print')).paddingTop")

        print(f"Print View Width: {width}")
        print(f"Print View Padding: {padding}")

        # 210mm ~ 793.7px. Allow small margin of error for different DPIs/browsers (usually 96dpi -> 793.7px)
        width_px = float(width.replace('px', ''))
        if 790 <= width_px <= 798:
             print("SUCCESS: Print View width is approx 210mm.")
        else:
             print(f"FAIL: Print View width {width} is not close to 210mm (793.7px).")

        # 4. Check XSS Prevention in Toast
        print("Testing XSS in Toast...")
        # Expose UI
        page.evaluate("import('./static/js/modules/ui.js').then(m => window.UI = m.UI)")
        # Wait a bit for import
        time.sleep(0.5)

        injection = '<img src=x onerror=document.body.setAttribute("data-xss","triggered")>'
        page.evaluate(f"window.UI.Toast.show('{injection}', 'error')")

        # Check if toast appeared
        toast = page.locator("#toast-container .text-sm")
        expect(toast).to_be_visible()

        # Check text content
        text = toast.text_content()
        print(f"Toast Text Content: {text}")

        if "<img" in text:
             print("SUCCESS: HTML tag rendered as text.")
        else:
             print("FAIL: HTML tag did not render as text (or toast failed).")

        # Check if XSS triggered
        xss_triggered = page.evaluate("document.body.getAttribute('data-xss')")
        if xss_triggered == "triggered":
            print("CRITICAL FAIL: XSS payload executed!")
        else:
            print("SUCCESS: XSS payload did not execute.")

        # Screenshot
        page.screenshot(path="verification/verification.png")
        print("Screenshot saved to verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()
