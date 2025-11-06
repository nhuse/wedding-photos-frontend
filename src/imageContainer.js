import React, { useState } from 'react';
import './imageContainer.css';
import PhotoModal from './components/PhotoModal';

export default function ImageContainer({ imageObjects }) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMediaClick = (media) => {
    const index = imageObjects.findIndex(item => item.key === media.key);
    setSelectedMediaIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMediaIndex(null);
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      <div className="image-grid">
        {imageObjects.map(media => {
        // Check if it's a video based on file extension or type
        const isVideo = media.type === 'video' || 
                       media.key?.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm)$/);
        
        const displayName = media.originalName || media.name || (() => {
          // If no original name, create a user-friendly name from the key
          const keyParts = media.key.split('.');
          const extension = keyParts.pop();
          const timestamp = keyParts[0];
          const date = new Date(parseInt(timestamp));
          const mediaType = media.type === 'video' ? 'Video' : 'Photo';
          return `${mediaType} ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${extension}`;
        })();
        
        if (isVideo) {
          return (
            <div key={media.key} className="image-item" onClick={() => handleMediaClick(media)} style={{ cursor: 'pointer' }}>
              <div className="image-wrapper">
                <video
                  controls
                  className="image"
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={media.publicUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="image-info">
                <div className="image-details">
                  {formatDate(media.uploaded)}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div key={media.key} className="image-item" onClick={() => handleMediaClick(media)} style={{ cursor: 'pointer' }}>
              <div className="image-wrapper">
                <img 
                  src={media.publicUrl} 
                  alt={displayName} 
                  className="image"
                />
              </div>
              <div className="image-info">
                <div className="image-details">
                  {formatDate(media.uploaded)}
                </div>
              </div>
            </div>
          );
        }
      })}
      </div>
      
      <PhotoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        imageObjects={imageObjects}
        currentIndex={selectedMediaIndex}
      />
    </>
  );
}