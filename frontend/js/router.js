// Simple client-side router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.previousRoute = null;
        
        // Listen for browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        this.previousRoute = this.currentRoute;
        this.currentRoute = path;
        
        // Cleanup previous route if it was dashboard
        if (this.previousRoute === '/' && window.DashboardPage) {
            window.DashboardPage.cleanup();
        }
        
        if (this.routes[path]) {
            this.routes[path]();
        } else {
            // Default to login if route not found
            this.navigate('/login');
        }
    }

    start() {
        this.handleRoute();
    }
}

window.router = new Router();