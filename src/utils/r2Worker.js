/**
 * Client-side utility for interacting with R2 Worker
 */

const WORKER_URL = process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev';

/**
 * Guest authentication utilities
 */

/**
 * Create a new guest session
 * @returns {Promise<Object>} - Session data
 */
export const createGuestSession = async () => {
  try {
    const response = await fetch(`${WORKER_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Guest authentication failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Guest auth error:', error);
    throw error;
  }
};

/**
 * Validate a guest session
 * @param {string} sessionId - Session ID to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateGuestSession = async (sessionId) => {
  try {
    const response = await fetch(`${WORKER_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Session validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Session validation error:', error);
    throw error;
  }
};

/**
 * Get user's own photos and videos
 * @param {string} sessionId - Guest session ID
 * @returns {Promise<Object>} - List of user's files
 */
export const getMyPhotos = async (sessionId) => {
  try {
    const url = new URL(`${WORKER_URL}/my-photos`);
    url.searchParams.set('sessionId', sessionId);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get my photos');
    }

    return await response.json();
  } catch (error) {
    console.error('Get my photos error:', error);
    throw error;
  }
};

/**
 * Upload file to R2 via Worker
 * @param {File} file - File to upload
 * @param {string} key - Optional custom key
 * @param {string} sessionId - Guest session ID
 * @returns {Promise<Object>} - Upload result
 */
export const uploadToR2ViaWorker = async (file, key = null, sessionId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (key) {
      formData.append('key', key);
    }

    // Add session ID if provided
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const response = await fetch(`${WORKER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Worker upload error:', error);
    throw error;
  }
};

/**
 * Get file from R2 via Worker
 * @param {string} key - File key
 * @returns {Promise<string>} - File URL
 */
export const getFileFromR2ViaWorker = (key) => {
  return `${WORKER_URL}/download?key=${encodeURIComponent(key)}`;
};

/**
 * List files from R2 via Worker
 * @param {string} prefix - Optional prefix filter
 * @param {number} limit - Optional limit
 * @param {string} bucketType - 'photos' or 'videos'
 * @returns {Promise<Array>} - List of files
 */
export const listFilesFromR2ViaWorker = async (prefix = '', limit = 100, bucketType = 'photos') => {
  try {
    const url = new URL(`${WORKER_URL}/list`);
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('bucketType', bucketType);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'List failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Worker list error:', error);
    throw error;
  }
};

/**
 * Delete file from R2 via Worker with ownership validation
 * @param {string} key - File key
 * @param {string} sessionId - Guest session ID for ownership validation
 * @returns {Promise<Object>} - Delete result
 */
export const deleteFileFromR2ViaWorker = async (key, sessionId = null) => {
  try {
    const url = new URL(`${WORKER_URL}/delete`);
    url.searchParams.set('key', key);
    
    if (sessionId) {
      url.searchParams.set('sessionId', sessionId);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Worker delete error:', error);
    throw error;
  }
};

/**
 * Generate unique file key
 * @param {string} fileName - Original file name
 * @returns {string} - Unique file key
 */
export const generateFileKey = (fileName) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${timestamp}-${randomId}.${extension}`;
}; 