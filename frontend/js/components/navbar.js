// Navbar component
class Navbar {
    static render() {
        const navbar = document.getElementById('navbar');
        if (!navbar) {
            console.error('Navbar element not found');
            return;
        }
        const isLoggedIn = AuthService.isLoggedIn();

        if (isLoggedIn) {
            navbar.innerHTML = `
                <a href="#" onclick="router.navigate('/')" class="${window.location.pathname === '/' ? 'active' : ''}">Dashboard</a>
                <a href="#" onclick="router.navigate('/trade')" class="${window.location.pathname === '/trade' ? 'active' : ''}">Trade</a>
                <a href="#" onclick="router.navigate('/portfolio')" class="${window.location.pathname === '/portfolio' ? 'active' : ''}">Portfolio</a>
                <a href="#" onclick="router.navigate('/transactions')" class="${window.location.pathname === '/transactions' ? 'active' : ''}">Transactions</a>
                <button onclick="AuthService.logout()" class="btn-logout">Logout</button>
            `;
        } else {
            navbar.innerHTML = `
                <a href="#" onclick="router.navigate('/login')" class="${window.location.pathname === '/login' ? 'active' : ''}">Login</a>
                <a href="#" onclick="router.navigate('/signup')" class="${window.location.pathname === '/signup' ? 'active' : ''}">Signup</a>
            `;
        }
    }
}

window.Navbar = Navbar;