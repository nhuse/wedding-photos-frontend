import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QR_TOKEN, PASSWORD_TOKEN, AUTH_URLS } from '../config/auth';
import { setAuthCache } from '../utils/authCache';

const VerifyAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token === QR_TOKEN || token === PASSWORD_TOKEN) {
      // Store the token in sessionStorage for backward compatibility
      sessionStorage.setItem('auth_token', token);
      
      // Store in cache with 24-hour expiration
      const authType = token === QR_TOKEN ? 'qr' : 'password';
      setAuthCache(token, authType);
      
      // Redirect to home page on successful auth
      navigate('/');
    } else {
      // Redirect to access denied page
      navigate(AUTH_URLS.ACCESS_DENIED);
    }
  }, [navigate, searchParams]);

  return null; // This component doesn't render anything
};

export default VerifyAuth;
