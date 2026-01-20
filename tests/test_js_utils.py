from playwright.sync_api import sync_playwright

def test_js_utilities():
    """
    Tests the JavaScript utilities in static/js/modules/utils.js
    by executing them in the browser context via Playwright.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the application to get the modules loaded
        page.goto("http://localhost:3000")

        # We need to wait for modules to be ready or import them dynamically in evaluate
        # Since app.js imports them, they should be available if we expose them or import them again.

        # Test Format.date
        result_date = page.evaluate("""async () => {
            const { Format } = await import('./static/js/modules/utils.js');
            return Format.date('2023-12-25');
        }""")
        assert result_date == '25/12/2023', f"Expected 25/12/2023, got {result_date}"

        result_date_iso = page.evaluate("""async () => {
            const { Format } = await import('./static/js/modules/utils.js');
            return Format.date('2023-12-25T15:30:00');
        }""")
        assert result_date_iso == '25/12/2023', f"Expected 25/12/2023, got {result_date_iso}"

        # Test Format.currency
        result_currency = page.evaluate("""async () => {
            const { Format } = await import('./static/js/modules/utils.js');
            return Format.currency(1500.50);
        }""")
        # Note: Non-breaking space might be present in currency formatting (U+00A0)
        # We normalize spaces for comparison
        result_currency = result_currency.replace('\xa0', ' ')
        assert result_currency == 'R$ 1.500,50', f"Expected R$ 1.500,50, got {result_currency}"

        # Test Validator.cpf
        # '123.456.789-09' -> 12345678909.
        # Let's verify the actual validator logic.
        # Mod11 on 123456789:
        # Sum1: 1*10 + 2*9 + ... + 9*2 = 165. Rem1 = (165*10)%11 = 1650%11 = 0. Digit 1 is 0. Matches.
        # Sum2: 1*11 + ... + 9*3 + 0*2 = 255. Rem2 = (255*10)%11 = 2550%11 = 9. Digit 2 is 9. Matches.
        # So 12345678909 IS actually a valid CPF checksum, ironically.
        # Let's use a definitely invalid one: 111.111.111-11

        valid_cpf = page.evaluate("""async () => {
            const { Validator } = await import('./static/js/modules/utils.js');
            return Validator.cpf('111.111.111-11');
        }""")
        assert valid_cpf == False, "Expected Invalid CPF (Repeated digits)"

        # Valid CPF (generated for testing: 529.982.247-25)
        valid_cpf_true = page.evaluate("""async () => {
            const { Validator } = await import('./static/js/modules/utils.js');
            return Validator.cpf('52998224725');
        }""")
        assert valid_cpf_true == True, "Expected Valid CPF"

        print("JS Utilities tests passed!")
        browser.close()

if __name__ == "__main__":
    test_js_utilities()
