import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Update login status when route changes (e.g., after login/logout)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location]);

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to Login page
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {isLoggedIn ? (
        <>
          <div className="nav-brand">
            <span className="brand-text">StockTrader</span>
          </div>
          <div className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/trade" className={location.pathname === '/trade' ? 'active' : ''}>
              Trade
            </Link>
            <Link to="/portfolio" className={location.pathname === '/portfolio' ? 'active' : ''}>
              Portfolio
            </Link>
            <Link to="/transactions" className={location.pathname === '/transactions' ? 'active' : ''}>
              Transactions
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="nav-brand">
            <span className="brand-text">StockTrader</span>
          </div>
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </div>
        </>
      )}
    </nav>
  );
}

export default Navbar;
