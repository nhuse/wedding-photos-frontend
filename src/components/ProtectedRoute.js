import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { QR_TOKEN, PASSWORD_TOKEN, AUTH_URLS } from '../config/auth';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const storedToken = sessionStorage.getItem('auth_token');
  const isAuthenticated = storedToken === QR_TOKEN || storedToken === PASSWORD_TOKEN;

  useEffect(() => {
    // On mount or route change, validate the stored token
    if (storedToken && !isAuthenticated) {
      // If stored token is invalid, remove it
      sessionStorage.removeItem('auth_token');
    }
  }, [storedToken, isAuthenticated]);

  // If no token or invalid token, and we're not already on these pages
  if (!isAuthenticated && 
      location.pathname !== AUTH_URLS.PASSWORD_ENTRY && 
      location.pathname !== AUTH_URLS.ACCESS_DENIED) {
    // Redirect to password entry instead of access denied on fresh load
    return <Navigate to={AUTH_URLS.PASSWORD_ENTRY} replace />;
  }

  return children;
}

export default ProtectedRoute;
