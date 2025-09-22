// Authentication tokens for wedding photos app
export const QR_TOKEN = "qr_code_token_1a2b3c4d5e6f7g8h9i0j";
export const PASSWORD_TOKEN = "wedding_2025_photos_access";

// Auth-related URLs (using relative paths)
export const AUTH_URLS = {
  AUTH_ENDPOINT: '/verify-auth',  // Changed from /api/auth to a route we can handle
  PASSWORD_ENTRY: '/password-entry',
  ACCESS_DENIED: '/access-denied'
};
