import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Check if token exists in localStorage
  const token = localStorage.getItem('token');

  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, allow access to protected route
  return children;
}

export default ProtectedRoute;
