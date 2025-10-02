// Authentication cache utility with 24-hour expiration
const AUTH_CACHE_KEY = 'wedding_auth_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Store authentication data with timestamp
 * @param {string} token - The authentication token
 * @param {string} authType - Type of authentication ('qr' or 'password')
 */
export function setAuthCache(token, authType = 'password') {
  const authData = {
    token,
    authType,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  };
  
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(authData));
    console.log('Authentication cached for 24 hours');
  } catch (error) {
    console.error('Failed to cache authentication:', error);
    // Fallback to sessionStorage if localStorage fails
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(authData));
  }
}

/**
 * Get cached authentication data if still valid
 * @returns {Object|null} Cached auth data or null if expired/invalid
 */
export function getAuthCache() {
  try {
    // Try localStorage first
    let cachedData = localStorage.getItem(AUTH_CACHE_KEY);
    
    // Fallback to sessionStorage if localStorage is empty
    if (!cachedData) {
      cachedData = sessionStorage.getItem(AUTH_CACHE_KEY);
    }
    
    if (!cachedData) {
      return null;
    }
    
    const authData = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache has expired
    if (now > authData.expiresAt) {
      console.log('Authentication cache expired, clearing...');
      clearAuthCache();
      return null;
    }
    
    // Check if cache is still valid (within 24 hours)
    if (now - authData.timestamp > CACHE_DURATION) {
      console.log('Authentication cache expired, clearing...');
      clearAuthCache();
      return null;
    }
    
    console.log('Valid authentication cache found');
    return authData;
  } catch (error) {
    console.error('Failed to read authentication cache:', error);
    clearAuthCache();
    return null;
  }
}

/**
 * Clear authentication cache from both localStorage and sessionStorage
 */
export function clearAuthCache() {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    console.log('Authentication cache cleared');
  } catch (error) {
    console.error('Failed to clear authentication cache:', error);
  }
}

/**
 * Check if authentication is cached and valid
 * @returns {boolean} True if valid cached auth exists
 */
export function isAuthCached() {
  const cachedAuth = getAuthCache();
  return cachedAuth !== null;
}

/**
 * Get remaining cache time in hours
 * @returns {number} Hours remaining in cache, or 0 if expired
 */
export function getCacheTimeRemaining() {
  const cachedAuth = getAuthCache();
  if (!cachedAuth) {
    return 0;
  }
  
  const now = Date.now();
  const remaining = cachedAuth.expiresAt - now;
  return Math.max(0, Math.floor(remaining / (60 * 60 * 1000))); // Convert to hours
}

/**
 * Get cache info for display purposes
 * @returns {Object} Cache information including type and time remaining
 */
export function getCacheInfo() {
  const cachedAuth = getAuthCache();
  if (!cachedAuth) {
    return null;
  }
  
  const hoursRemaining = getCacheTimeRemaining();
  const authTypeDisplay = cachedAuth.authType === 'qr' ? 'QR Code' : 'Password';
  
  return {
    type: authTypeDisplay,
    hoursRemaining,
    isExpired: hoursRemaining === 0,
    expiresAt: new Date(cachedAuth.expiresAt).toLocaleString()
  };
}
