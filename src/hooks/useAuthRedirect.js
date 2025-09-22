import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkToken = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        return;
      }

      try {
        // Make a request to your auth API endpoint
        const response = await fetch(`/api/auth?token=${encodeURIComponent(token)}`);
        
        if (response.ok) {
          // If token is valid, redirect to the upload page
          navigate('/gallery');
        } else {
          // If token is invalid, redirect to access denied
          navigate('/access-denied');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        navigate('/access-denied');
      }
    };

    checkToken();
  }, [location.search, navigate]);
}
