import { useState, useEffect, useCallback } from 'react';
import { createGuestSession, validateGuestSession } from '../utils/r2Worker';

/**
 * Custom hook for managing guest sessions
 * @returns {Object} Session management functions and state
 */
export const useGuestSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize or restore guest session
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing session in localStorage
      const storedSession = localStorage.getItem('weddingGuestSession');
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // Validate existing session
        try {
          const validation = await validateGuestSession(sessionData.sessionId);
          if (validation.valid) {
            setSessionId(sessionData.sessionId);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('Stored session validation failed:', error);
          // Continue to create new session
        }
      }

      // Create new session
      const newSession = await createGuestSession();
      
      // Store in localStorage
      localStorage.setItem('weddingGuestSession', JSON.stringify({
        sessionId: newSession.sessionId,
        createdAt: Date.now(),
      }));

      setSessionId(newSession.sessionId);
    } catch (error) {
      console.error('Session initialization failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    localStorage.removeItem('weddingGuestSession');
    setSessionId(null);
    setError(null);
  }, []);

  /**
   * Refresh session (create new one)
   */
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newSession = await createGuestSession();
      
      // Store in localStorage
      localStorage.setItem('weddingGuestSession', JSON.stringify({
        sessionId: newSession.sessionId,
        createdAt: Date.now(),
      }));

      setSessionId(newSession.sessionId);
    } catch (error) {
      console.error('Session refresh failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sessionId,
    isLoading,
    error,
    clearSession,
    refreshSession,
    initializeSession,
  };
}; 