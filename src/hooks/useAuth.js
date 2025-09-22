import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AUTH_URLS, QR_TOKEN, PASSWORD_TOKEN } from '../config/auth';

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

      // If no token is present and we're not on the password entry page,
      // redirect to password entry
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
        // Store the token in sessionStorage for persistence
        sessionStorage.setItem('auth_token', token);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('auth_token');
        if (location.pathname !== AUTH_URLS.ACCESS_DENIED && 
            location.pathname !== AUTH_URLS.PASSWORD_ENTRY &&
            location.pathname !== AUTH_URLS.AUTH_ENDPOINT) {
          navigate(AUTH_URLS.ACCESS_DENIED);
        }
      }
      setIsLoading(false);
    };

    // Check for token in sessionStorage if no token in URL
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const storedToken = sessionStorage.getItem('auth_token');

    if (!urlToken && storedToken) {
      // Revalidate stored token
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('token', storedToken);
      window.history.replaceState({}, '', newUrl);
    }

    validateAuth();
  }, [location.search, location.pathname, navigate]);

  return { isAuthenticated, isLoading };
}
