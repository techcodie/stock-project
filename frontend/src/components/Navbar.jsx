import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Update login status when route changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/' && !isLoggedIn;

  return (
    <nav className={`navbar ${isLandingPage ? 'navbar-transparent' : ''}`}>
      <div className="nav-brand">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="brand-link">
          <span className="brand-icon">📈</span>
          <span className="brand-text">StockTrader</span>
        </Link>
      </div>

      {isLoggedIn ? (
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/trade"
            className={`nav-link ${location.pathname === '/trade' ? 'active' : ''}`}
          >
            Trade
          </Link>
          <Link
            to="/portfolio"
            className={`nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}
          >
            Portfolio
          </Link>
          <Link
            to="/transactions"
            className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}
          >
            Transactions
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/login" className="nav-link-auth">
            Login
          </Link>
          <Link to="/signup" className="btn-nav-signup">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
