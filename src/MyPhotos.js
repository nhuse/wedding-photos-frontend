import React, { useState, useEffect, useCallback } from 'react';
import { useGuestSession } from './hooks/useGuestSession';
import { getMyPhotos, deleteFileFromR2ViaWorker } from './utils/r2Worker';
import PhotoModal from './components/PhotoModal';
import './MyPhotos.css';

function MyPhotos({ onFileDeleted = null }) {
  const { sessionId, isLoading: sessionLoading, error: sessionError } = useGuestSession();
  const [myPhotos, setMyPhotos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  console.log(sessionId);

  const loadMyPhotos = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // Load all files from the single bucket
      const result = await getMyPhotos(sessionId);
      console.log('Files result:', result); // Debug logging
      
      // Separate photos and videos based on file type
      const allFiles = result.files || [];
      console.log('All files:', allFiles); // Debug logging
      console.log('Total files returned:', allFiles.length);
      
      // Check what fields are actually available
      if (allFiles.length > 0) {
        console.log('First file structure:', allFiles[0]);
        console.log('First file fields:', Object.keys(allFiles[0]));
        console.log('First file originalName:', allFiles[0].originalName);
        console.log('First file name:', allFiles[0].name);
        console.log('First file key:', allFiles[0].key);
        console.log('First file fileType:', allFiles[0].fileType);
        console.log('First file type:', allFiles[0].type);
        
        // Check if there are any video-like files
        const potentialVideos = allFiles.filter(file => {
          const key = file.key.toLowerCase();
          return key.includes('.mp4') || key.includes('.mov') || key.includes('.m4v') || key.includes('.3gp');
        });
        console.log('Potential video files by extension:', potentialVideos);
      }
      
      // Filter based on the actual field names in the response
      const photos = allFiles.filter(file => {
        // Check multiple possible field names
        const fileType = file.fileType || file.type || 'image';
        const isPhoto = fileType === 'image' || fileType === 'photo' || fileType.startsWith('image/');
        console.log(`File ${file.key}: fileType=${file.fileType}, type=${file.type}, isPhoto=${isPhoto}`);
        return isPhoto;
      });
      
      const videos = allFiles.filter(file => {
        const fileType = file.fileType || file.type || 'image';
        // More comprehensive video detection
        const isVideo = fileType === 'video' || 
                       fileType.startsWith('video/') ||
                       file.key.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm|m4v|3gp)$/);
        console.log(`File ${file.key}: fileType=${file.fileType}, type=${file.type}, isVideo=${isVideo}, key=${file.key}`);
        return isVideo;
      });
      
      console.log('Filtered photos:', photos);
      console.log('Filtered videos:', videos);
      
      setMyPhotos(photos);
      setMyVideos(videos);

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

  const handleDelete = async (fileKey) => {
    if (!sessionId) return;

    try {
      setDeleting(prev => ({ ...prev, [fileKey]: true }));

      await deleteFileFromR2ViaWorker(fileKey, sessionId);

      // Remove from state
      setMyPhotos(prev => prev.filter(file => file.key !== fileKey));
      setMyVideos(prev => prev.filter(file => file.key !== fileKey));

      alert('File deleted successfully!');
      
      // Call the callback to refresh the main photos list
      if (onFileDeleted) {
        onFileDeleted();
      }
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

  const handleMediaClick = (media) => {
    // Add the publicUrl for the modal
    const mediaWithUrl = {
      ...media,
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(media.key)}`
    };
    setSelectedMedia(mediaWithUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMedia(null);
  };

  // Show loading state while session is initializing
  if (sessionLoading) {
    return (
      <div className="image-container" style={{
        padding: '20px',
      }}>
        <h2 style={{
          color: '#5D4037',
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}>
          My Wedding Memories
        </h2>
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          fontFamily: '"Lora", "Georgia", serif',
          color: '#5D4037'
        }}>
          <div>🔄 Initializing guest session...</div>
        </div>
      </div>
    );
  }

  // Show error state if session failed
  if (sessionError) {
    return (
      <div className="image-container" style={{
        background: 'linear-gradient(135deg, #FEFEFE 0%, #F5F5DC 100%)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h2 style={{
          color: '#5D4037',
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}>
          My Wedding Memories
        </h2>
        <div style={{ 
          marginBottom: 16, 
          padding: 16, 
          borderRadius: 8,
          color: '#C62828',
          fontFamily: '"Lora", "Georgia", serif',
        }}>
          ❌ Session Error: {sessionError}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#5A86AD',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontFamily: '"Lora", "Georgia", serif',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(90, 134, 173, 0.3)'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  const totalFiles = myPhotos.length + myVideos.length;

  return (
    <div className="image-container" style={{
      padding: '10px',
    }}>
      <h2 style={{
        color: '#5D4037',
        fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        fontSize: '2.5rem',
        marginBottom: '10px'
      }}>
        My Wedding Memories
      </h2>
      

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
          color: '#666',
          fontSize: '2rem'
        }}>
          <div>You haven't uploaded any photos or videos yet.</div>
          <div style={{ marginTop: '10px', fontSize: '1.75rem' }}>
            Upload some to see them here!
          </div>
        </div>
      )}

      {/* Photos Section */}
      {myPhotos.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            color: '#5D4037',
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            Wedding Photos ({myPhotos.length})
          </h3>
          <div className="image-grid">
            {myPhotos.map((file) => (
              <div key={file.key} className="image-item" onClick={() => handleMediaClick(file)} style={{ cursor: 'pointer' }}>
                <div className="image-wrapper">
                  <img
                    src={`${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`}
                    alt={file.originalName || file.key}
                    className="image"
                  />
                  <div className="image-overlay">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.key);
                      }}
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
                    {(() => {
                      const displayName = file.originalName || file.key.split('/').pop();
                      console.log('MyPhotos photo display name:', displayName, 'for file:', file);
                      return displayName;
                    })()}
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
          <h3 style={{
            color: '#5D4037',
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            Wedding Videos ({myVideos.length})
          </h3>
          <div className="image-grid">
            {myVideos.map((file) => (
              <div key={file.key} className="image-item" onClick={() => handleMediaClick(file)} style={{ cursor: 'pointer' }}>
                <div className="image-wrapper">
                  <video
                    src={`${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`}
                    controls
                    className="image"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="image-overlay">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.key);
                      }}
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
                    {(() => {
                      const displayName = file.originalName || file.key.split('/').pop();
                      console.log('MyPhotos video display name:', displayName, 'for file:', file);
                      return displayName;
                    })()}
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
              padding: '12px 24px',
              backgroundColor: '#5A86AD',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: '"Lora", "Georgia", serif',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(90, 134, 173, 0.3)'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh My Photos'}
          </button>
        </div>
      )}
      
      <PhotoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        media={selectedMedia}
      />
    </div>
  );
}

export default MyPhotos; 