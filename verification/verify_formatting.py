from playwright.sync_api import sync_playwright

def verify_dashboard_formatting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the dashboard
        page.goto("http://localhost:3000")

        # Wait for dashboard to load
        page.wait_for_selector("#view-dashboard")

        # Screenshot the Dashboard to check date and currency formatting
        # We need to manually add some data to Storage to verify rendering if empty
        # But we assume the dev environment might have data, or we just check the structure.
        # Let's inject some data via console to ensure we see the formatting.

        page.evaluate("""
            const mockData = [{
                id: 123,
                numeroProcesso: '00100.2024.5.12.0001',
                nomeAutor: 'João Silva',
                status: 'Concluido',
                valorHonorarios: 1500.50,
                statusPagamento: 'Pendente',
                dataPericia: '2023-12-25',
                createdAt: new Date().toISOString()
            }];
            localStorage.setItem('pericia_sys_data', JSON.stringify(mockData));
            // Trigger render
            import('./static/js/modules/dashboard.js').then(m => m.DashboardController.render());
        """)

        # Reload to ensure clean render from storage
        page.reload()
        page.wait_for_selector("#view-dashboard")

        page.screenshot(path="verification/dashboard_formatting.png")
        print("Dashboard formatting screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_dashboard_formatting()
