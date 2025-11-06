import React, { useState, useEffect, useCallback } from 'react';
import ImageContainer from '../imageContainer';
import { listFilesFromR2ViaWorker } from '../utils/r2Worker';

// Function to get R2 files from both buckets
async function getR2Files() {
  try {
    // Get photos from photos bucket
    const photosResult = await listFilesFromR2ViaWorker('', 100, 'photos');
    const photos = photosResult.files || [];
    
    // Get videos from videos bucket
    const videosResult = await listFilesFromR2ViaWorker('', 100, 'videos');
    const videos = videosResult.files || [];
    
    // Convert photos to the format expected by ImageContainer
    const photoObjects = photos.map(file => ({
      ...file,
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`,
      type: 'photo',
      originalName: file.originalName || file.name || (() => {
        const keyParts = file.key.split('.');
        const extension = keyParts.pop();
        const timestamp = keyParts[0];
        const date = new Date(parseInt(timestamp));
        return `Photo ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${extension}`;
      })()
    }));
    
    // Convert videos to the format expected by ImageContainer
    const videoObjects = videos.map(file => ({
      ...file,
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`,
      type: 'video',
      originalName: file.originalName || file.name || (() => {
        const keyParts = file.key.split('.');
        const extension = keyParts.pop();
        const timestamp = keyParts[0];
        const date = new Date(parseInt(timestamp));
        return `Video ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${extension}`;
      })()
    }));
    
    // Combine photos and videos, sort by upload date (most recent first), and take the 10 most recent
    const allMedia = [...photoObjects, ...videoObjects]
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      .slice(0, 10);
    
    return { imageObjects: allMedia };
  } catch (error) {
    console.error('Error fetching R2 files:', error);
    return { imageObjects: [] };
  }
}

function Gallery({ refreshTrigger = 0 }) {
  const [imageObjects, setImageObjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const { imageObjects } = await getR2Files();
      setImageObjects(imageObjects);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia, refreshTrigger]);

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'fit-content',
      padding: '40px 20px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ 
        marginBottom: '20px', 
        color: '#5D4037', 
        textAlign: 'center',
        fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginTop: '0px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}>
        Wedding Gallery
      </h3>
      
      <div style={{ width: '100%', maxWidth: '1200px', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-text">Loading images and videos...</div>
            <div className="loading-text" style={{ fontSize: '14px', marginTop: '10px' }}>
              This may take a moment on first load
            </div>
          </div>
        ) : imageObjects.length === 0 ? (
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
        ) : (
          <ImageContainer imageObjects={imageObjects} />
        )}
      </div>
    </div>
  );
}

export default Gallery;
