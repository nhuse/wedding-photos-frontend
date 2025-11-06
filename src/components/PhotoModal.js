import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PhotoModal.css';

const PhotoModal = ({ isOpen, onClose, imageObjects, currentIndex }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const imageRef = useRef(null);

  // Update current index when currentIndex prop changes
  useEffect(() => {
    if (currentIndex !== null && currentIndex !== undefined) {
      setCurrentMediaIndex(currentIndex);
    }
  }, [currentIndex]);

  // Reset state when modal opens/closes or media changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [isOpen, currentMediaIndex]);

  // Navigation functions
  const handleNext = useCallback(() => {
    if (imageObjects && imageObjects.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % imageObjects.length);
    }
  }, [imageObjects]);

  const handlePrevious = useCallback(() => {
    if (imageObjects && imageObjects.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + imageObjects.length) % imageObjects.length);
    }
  }, [imageObjects]);

  // Handle keyboard navigation (escape, left arrow, right arrow)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handleNext, handlePrevious]);

  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Handle zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    // Reset position when zooming out to minimum
    if (zoomLevel <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // Handle download
  const handleDownload = async () => {
    const media = imageObjects[currentMediaIndex];
    if (!media) return;
    
    try {
      const response = await fetch(media.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.originalName || media.name || `wedding-photo-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  // Handle mouse drag for panning when zoomed
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    if (zoomLevel > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen || !imageObjects || imageObjects.length === 0) return null;

  const media = imageObjects[currentMediaIndex];
  if (!media) return null;

  const isVideo = media.type === 'video' || 
                  media.key?.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm)$/);

  return (
    <div 
      className="photo-modal-overlay" 
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="photo-modal-content">
        {/* Close button */}
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Download button */}
        <button 
          className="modal-download-btn" 
          onClick={handleDownload}
          aria-label="Download image"
          title="Download image"
        >
          ⬇️
        </button>

        {/* Zoom controls */}
        <div className="modal-zoom-controls">
          <button 
            className="modal-zoom-btn" 
            onClick={zoomLevel > 1 ? handleZoomOut : handleZoomIn}
            aria-label={zoomLevel > 1 ? "Zoom out" : "Zoom in"}
            title={zoomLevel > 1 ? "Zoom out" : "Zoom in"}
          >
            {zoomLevel > 1 ? "🔍-" : "🔍+"}
          </button>
        </div>

        {/* Navigation arrows */}
        <button 
          className="modal-nav-btn modal-nav-left" 
          onClick={handlePrevious}
          aria-label="Previous image"
          title="Previous image"
        >
          ‹
        </button>
        <button 
          className="modal-nav-btn modal-nav-right" 
          onClick={handleNext}
          aria-label="Next image"
          title="Next image"
        >
          ›
        </button>

        {/* Media content */}
        <div 
          className="modal-media-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {isVideo ? (
            <video
              ref={imageRef}
              src={media.publicUrl}
              controls
              className="modal-media"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease'
              }}
            />
          ) : (
            <img
              ref={imageRef}
              src={media.publicUrl}
              alt={media.originalName || media.name || 'Wedding photo'}
              className="modal-media"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease'
              }}
            />
          )}
        </div>

        {/* Media info */}
        <div className="modal-media-info">
          <div className="modal-media-name">
            {media.originalName || media.name || 'Wedding photo'}
          </div>
          <div className="modal-media-details">
            {media.uploaded && new Date(media.uploaded).toLocaleDateString()}
            {media.size && ` • ${formatFileSize(media.size)}`}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default PhotoModal;
