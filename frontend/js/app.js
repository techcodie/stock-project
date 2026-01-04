// Main application initialization
class App {
    static init() {
        // Setup routes
        router.addRoute('/', () => {
            console.log('Dashboard route called');
            try {
                Navbar.render();
                DashboardPage.render();
            } catch (error) {
                console.error('Error rendering Dashboard route:', error);
                const mainContent = document.getElementById('main-content');
                if (mainContent) mainContent.innerHTML = `<div class="error">Failed to load dashboard: ${error.message}</div>`;
            }
        });

        router.addRoute('/login', () => {
            Navbar.render();
            LoginPage.render();
        });

        router.addRoute('/signup', () => {
            Navbar.render();
            SignupPage.render();
        });

        router.addRoute('/trade', () => {
            Navbar.render();
            TradePage.render();
        });

        router.addRoute('/portfolio', () => {
            Navbar.render();
            PortfolioPage.render();
        });

        router.addRoute('/transactions', () => {
            Navbar.render();
            TransactionsPage.render();
        });

        // Start the router
        router.start();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});