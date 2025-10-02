import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { QR_TOKEN, PASSWORD_TOKEN, AUTH_URLS } from '../config/auth';
import { getAuthCache } from '../utils/authCache';

function ProtectedRoute({ children }) {
  const location = useLocation();
  
  // Check both sessionStorage and cache for authentication
  const storedToken = sessionStorage.getItem('auth_token');
  const cachedAuth = getAuthCache();
  
  // Determine if user is authenticated
  const isSessionAuthenticated = storedToken === QR_TOKEN || storedToken === PASSWORD_TOKEN;
  const isCachedAuthenticated = cachedAuth && (cachedAuth.token === QR_TOKEN || cachedAuth.token === PASSWORD_TOKEN);
  const isAuthenticated = isSessionAuthenticated || isCachedAuthenticated;

  useEffect(() => {
    // Clean up invalid tokens
    if (storedToken && !isSessionAuthenticated) {
      sessionStorage.removeItem('auth_token');
    }
    
    // If we have cached auth but no session token, update session for consistency
    if (cachedAuth && !storedToken) {
      sessionStorage.setItem('auth_token', cachedAuth.token);
    }
  }, [storedToken, isSessionAuthenticated, cachedAuth]);

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
