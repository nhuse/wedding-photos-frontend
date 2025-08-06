import { useState, useCallback } from 'react';
import { uploadToR2ViaWorker, generateFileKey } from '../utils/r2Worker';

/**
 * Custom hook for R2 Worker file uploads with session tracking
 * @param {string} sessionId - Guest session ID for ownership tracking
 * @returns {Object} Upload functions and state
 */
export const useR2WorkerUpload = (sessionId = null) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Upload file to R2 via Worker
   * @param {File} file - File to upload
   * @param {string} bucketType - Bucket type ('photos' or 'videos')
   * @returns {Promise<Object>} - Upload result
   */
  const uploadFile = useCallback(async (file, bucketType = 'photos') => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Generate unique file key
      const fileKey = generateFileKey(file.name, bucketType);
      
      // Upload to R2 via Worker with session tracking
      const result = await uploadToR2ViaWorker(file, fileKey, bucketType, sessionId);
      
      setUploadProgress(100);
      setUploading(false);
      
      return {
        url: result.url,
        key: result.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sessionId: result.sessionId,
      };
    } catch (error) {
      setUploadError(error.message);
      setUploading(false);
      throw error;
    }
  }, [sessionId]);

  /**
   * Upload multiple files via Worker
   * @param {File[]} files - Array of files to upload
   * @param {string} bucketType - Bucket type ('photos' or 'videos')
   * @returns {Promise<Array>} - Array of upload results
   */
  const uploadMultipleFiles = useCallback(async (files, bucketType = 'photos') => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const results = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Determine bucket type based on file type
        const fileBucketType = file.type.startsWith('video/') ? 'videos' : 'photos';
        const result = await uploadFile(file, fileBucketType);
        results.push(result);
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
      }

      setUploading(false);
      return results;
    } catch (error) {
      setUploadError(error.message);
      setUploading(false);
      throw error;
    }
  }, [uploadFile]);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    resetUpload,
    uploading,
    uploadProgress,
    uploadError
  };
}; 