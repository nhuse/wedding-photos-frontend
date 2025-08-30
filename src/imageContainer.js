import './imageContainer.css';

export default function ImageContainer({ imageObjects }) {
  console.log('ImageContainer received imageObjects:', imageObjects);
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="image-grid">
      {imageObjects.map(media => {
        console.log('Processing media item:', media);
        console.log('Media originalName:', media.originalName);
        console.log('Media name:', media.name);
        console.log('Media key:', media.key);
        
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
        console.log('Final display name:', displayName);
        
        if (isVideo) {
          return (
            <div key={media.key} className="image-item">
              <div className="image-wrapper">
                <video
                  controls
                  className="image"
                  preload="metadata"
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
            <div key={media.key} className="image-item">
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
  );
}