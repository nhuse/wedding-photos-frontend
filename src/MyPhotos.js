import React, { useState, useEffect, useCallback } from 'react';
import { useGuestSession } from './hooks/useGuestSession';
import { getMyPhotos, deleteFileFromR2ViaWorker } from './utils/r2Worker';
import './imageContainer.css';

function MyPhotos() {
  const { sessionId, isLoading: sessionLoading, error: sessionError } = useGuestSession();
  const [myPhotos, setMyPhotos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});

  const loadMyPhotos = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // Load photos
      const photosResult = await getMyPhotos(sessionId, 'photos');
      setMyPhotos(photosResult.files || []);

      // Load videos
      const videosResult = await getMyPhotos(sessionId, 'videos');
      setMyVideos(videosResult.files || []);

    } catch (error) {
      console.error('Failed to load my photos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId && !sessionLoading) {
      loadMyPhotos();
    }
  }, [sessionId, sessionLoading, loadMyPhotos]);

  const handleDelete = async (fileKey, bucketType) => {
    if (!sessionId) return;

    try {
      setDeleting(prev => ({ ...prev, [fileKey]: true }));

      await deleteFileFromR2ViaWorker(fileKey, bucketType, sessionId);

      // Remove from state
      if (bucketType === 'photos') {
        setMyPhotos(prev => prev.filter(file => file.key !== fileKey));
      } else {
        setMyVideos(prev => prev.filter(file => file.key !== fileKey));
      }

      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    } finally {
      setDeleting(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Show loading state while session is initializing
  if (sessionLoading) {
    return (
      <div className="image-container">
        <h2>My Photos</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>Initializing guest session...</div>
        </div>
      </div>
    );
  }

  // Show error state if session failed
  if (sessionError) {
    return (
      <div className="image-container">
        <h2>My Photos</h2>
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: '#ffebee', 
          borderRadius: 4,
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          Session Error: {sessionError}
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

  const totalFiles = myPhotos.length + myVideos.length;

  return (
    <div className="image-container">
      <h2>My Photos & Videos</h2>
      
      {/* Session Info */}
      <div style={{ 
        marginBottom: 16, 
        padding: 12, 
        backgroundColor: '#e8f5e8', 
        borderRadius: 4,
        border: '1px solid #4caf50',
        fontSize: '14px'
      }}>
        <strong>Your Guest Session</strong><br />
        Session ID: {sessionId ? `${sessionId.substring(0, 8)}...` : 'Loading...'}<br />
        Total Files: {totalFiles}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: '#ffebee', 
          borderRadius: 4,
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>Loading your photos...</div>
        </div>
      )}

      {/* No Photos Message */}
      {!loading && totalFiles === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#666',
          fontSize: '16px'
        }}>
          <div>You haven't uploaded any photos yet.</div>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Upload some photos to see them here!
          </div>
        </div>
      )}

      {/* Photos Section */}
      {myPhotos.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Photos ({myPhotos.length})</h3>
          <div className="image-grid">
            {myPhotos.map((file) => (
              <div key={file.key} className="image-item">
                <div className="image-wrapper">
                  <img
                    src={`${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}&bucketType=photos`}
                    alt={file.originalName || file.key}
                    className="image"
                  />
                  <div className="image-overlay">
                    <button
                      onClick={() => handleDelete(file.key, 'photos')}
                      disabled={deleting[file.key]}
                      className="delete-button"
                      style={{
                        backgroundColor: deleting[file.key] ? '#ccc' : '#f44336',
                        cursor: deleting[file.key] ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deleting[file.key] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="image-info">
                  <div className="image-name">
                    {file.originalName || file.key.split('/').pop()}
                  </div>
                  <div className="image-details">
                    {formatFileSize(file.size)} • {formatDate(file.uploaded)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {myVideos.length > 0 && (
        <div>
          <h3>Videos ({myVideos.length})</h3>
          <div className="image-grid">
            {myVideos.map((file) => (
              <div key={file.key} className="image-item">
                <div className="image-wrapper">
                  <video
                    src={`${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}&bucketType=videos`}
                    controls
                    className="image"
                  />
                  <div className="image-overlay">
                    <button
                      onClick={() => handleDelete(file.key, 'videos')}
                      disabled={deleting[file.key]}
                      className="delete-button"
                      style={{
                        backgroundColor: deleting[file.key] ? '#ccc' : '#f44336',
                        cursor: deleting[file.key] ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deleting[file.key] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="image-info">
                  <div className="image-name">
                    {file.originalName || file.key.split('/').pop()}
                  </div>
                  <div className="image-details">
                    {formatFileSize(file.size)} • {formatDate(file.uploaded)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      {totalFiles > 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={loadMyPhotos}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6699cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh My Photos'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MyPhotos; 