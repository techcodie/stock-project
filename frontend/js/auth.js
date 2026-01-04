// Authentication utilities
class AuthService {
    static isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    static logout() {
        localStorage.removeItem('token');
        window.router.navigate('/login');
    }

    static requireAuth() {
        if (!this.isLoggedIn()) {
            window.router.navigate('/login');
            return false;
        }
        return true;
    }
}

window.AuthService = AuthService;