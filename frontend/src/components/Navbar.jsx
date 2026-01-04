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
    <nav>
      {isLoggedIn ? (
        <>
          <Link to="/">Dashboard</Link>
          <Link to="/trade">Trade</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/transactions">Transactions</Link>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;
