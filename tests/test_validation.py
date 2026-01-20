import re
from playwright.sync_api import Page, expect

def test_validation_logic(page: Page):
    """
    Test that the form validation correctly blocks submission
    when required fields are missing, and shows error states.
    """
    # 1. Arrange: Go to "Nova Perícia"
    page.goto("http://localhost:3000/#nova")

    # 2. Act: Click "Finalizar" immediately (empty form)
    finalize_btn = page.get_by_role("button", name="Finalizar")
    finalize_btn.click()

    # 3. Assert: Validation Errors should appear
    # The Toast container should be visible and contain error text
    toast_container = page.locator("#toast-container")
    expect(toast_container).to_contain_text("Número do Processo é obrigatório")
    expect(toast_container).to_contain_text("Nome do Autor é obrigatório")

    # 4. Assert: Visual Indicators (ARIA & Classes)
    input_processo = page.locator("#f-numero_processo")
    expect(input_processo).to_have_attribute("aria-invalid", "true")
    # Use to_have_class with regex to match partial class because Playwright checks full string by default,
    # OR better, check for the specific class presence in the list.
    # However, to_have_class checks EXACT match or list match.
    # We should expect the full string or partial with regex.
    expect(input_processo).to_have_class(re.compile(r"border-red-500"))

    # 5. Act: Fill one field and retry
    input_processo.fill("123456")
    finalize_btn.click()

    # 6. Assert: That specific field should no longer be invalid
    # Note: We need to wait for validation logic to re-run.
    # The validation resets errors at the start of validateData, then re-applies if invalid.
    # Since we filled it, it should be clean.
    expect(input_processo).not_to_have_attribute("aria-invalid", "true")
    expect(input_processo).not_to_have_class(r"border-red-500")
