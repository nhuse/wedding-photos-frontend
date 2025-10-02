import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AUTH_URLS, QR_TOKEN, PASSWORD_TOKEN } from '../config/auth';
import { getAuthCache, setAuthCache, clearAuthCache, isAuthCached } from '../utils/authCache';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      // Check for cached authentication first
      const cachedAuth = getAuthCache();
      
      // If no token in URL but we have valid cached auth, use it
      if (!token && cachedAuth) {
        console.log('Using cached authentication');
        setIsAuthenticated(true);
        // Update URL to include the cached token for consistency
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('token', cachedAuth.token);
        window.history.replaceState({}, '', newUrl);
        setIsLoading(false);
        return;
      }

      // If no token is present and no cached auth, redirect to password entry
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        if (location.pathname !== AUTH_URLS.PASSWORD_ENTRY && 
            location.pathname !== AUTH_URLS.ACCESS_DENIED) {
          navigate(AUTH_URLS.PASSWORD_ENTRY);
        }
        return;
      }

      // Validate token directly
      if (token === QR_TOKEN || token === PASSWORD_TOKEN) {
        setIsAuthenticated(true);
        
        // Determine auth type for caching
        const authType = token === QR_TOKEN ? 'qr' : 'password';
        
        // Store in both sessionStorage (for backward compatibility) and cache
        sessionStorage.setItem('auth_token', token);
        setAuthCache(token, authType);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('auth_token');
        clearAuthCache();
        if (location.pathname !== AUTH_URLS.ACCESS_DENIED && 
            location.pathname !== AUTH_URLS.PASSWORD_ENTRY &&
            location.pathname !== AUTH_URLS.AUTH_ENDPOINT) {
          navigate(AUTH_URLS.ACCESS_DENIED);
        }
      }
      setIsLoading(false);
    };

    validateAuth();
  }, [location.search, location.pathname, navigate]);

  return { isAuthenticated, isLoading };
}
