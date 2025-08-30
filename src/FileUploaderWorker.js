import React, { useState } from 'react';
import './FileUploader.css';
import { useR2WorkerUpload } from './hooks/useR2WorkerUpload';
import { useGuestSession } from './hooks/useGuestSession';

function FileUploaderWorker({ onUploadSuccess }) {
  const [previews, setPreviews] = useState([]);
  const { sessionId, isLoading: sessionLoading, error: sessionError } = useGuestSession();
  const { uploadMultipleFiles, uploading, uploadProgress, uploadError, resetUpload } = useR2WorkerUpload(sessionId);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newPreviews = files.map(file => {
      const url = URL.createObjectURL(file);
      return { file, url };
    });
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(prev[indexToRemove].url);
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    try {
      const files = previews.map(preview => preview.file);
      const results = await uploadMultipleFiles(files);
      
      console.log('Upload results:', results);
      alert(`Upload complete! Successfully uploaded ${results.length} files.`);
      
      // Clear previews and reset upload state
      setPreviews([]);
      resetUpload();
      
      // Call the success callback to refresh the media list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  // Show loading state while session is initializing
  if (sessionLoading) {
    return (
      <div className='file-uploader'>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>Initializing guest session...</div>
        </div>
      </div>
    );
  }

  // Show error state if session failed
  if (sessionError) {
    return (
      <div className='file-uploader'>
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: '#ffebee', 
          borderRadius: 4,
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          Error: {sessionError}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6699cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='file-uploader' style={{ display: 'flex' }}>
      {/* Upload Progress */}
      {uploading && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          borderRadius: 4,
          border: '1px solid #2196f3',
          justifySelf: 'center',
          alignSelf: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Uploading via Worker...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: 8, 
            backgroundColor: '#e0e0e0', 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              height: '100%', 
              backgroundColor: '#2196f3',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: '#ffebee', 
          borderRadius: 4,
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          Error: {uploadError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center', justifySelf: 'center' }}>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input-worker"
          disabled={uploading}
        />
        <label
          htmlFor="file-input-worker"
          className="file-uploader-upload-btn"
          style={{
            opacity: uploading ? 0.6 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          Add Images and Videos
        </label>
        {previews.length > 0 && (
          <span className='file-uploader-selected-files'>
            {previews.length} file{previews.length === 1 ? '' : 's'} selected
          </span>
        )}
      </div>

      {/* File Previews */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16 }}>
        {previews.map((preview, idx) => {
          if (preview.file.type.startsWith('image/')) {
            return (
              <div key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }}
                />
                <button
                  className="remove-btn"
                  onClick={() => removeFile(idx)}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5
                  }}
                >
                  ×
                </button>
              </div>
            );
          } else if (preview.file.type.startsWith('video/')) {
            return (
              <div key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <video
                  src={preview.url}
                  controls
                  style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }}
                />
                <button
                  className="remove-btn"
                  onClick={() => removeFile(idx)}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5
                  }}
                >
                  ×
                </button>
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>

      {/* Upload Button */}
      {previews.length > 0 && (
        <button 
          className="file-uploader-upload-btn"
          onClick={handleUpload}
          disabled={uploading}
          style={{
            marginTop: 16,
            marginBottom: 16
          }}
        >
          {uploading ? 'Uploading via Worker...' : 'Publish Your Photos and Videos'}
        </button>
      )}
    </div>
  );
}

export default FileUploaderWorker; 