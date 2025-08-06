import './imageContainer.css';

export default function ImageContainer({ imageObjects }) {
  return (
    <div className='images-container'>
      {imageObjects.map(media => {
        // Check if it's a video based on file extension or type
        const isVideo = media.type === 'video' || 
                       media.key?.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm)$/);
        
        if (isVideo) {
          return (
            <video 
              key={media.key} 
              controls 
              className='image'
              style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
              preload="metadata"
            >
              <source src={media.publicUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          );
        } else {
          return (
            <img 
              src={media.publicUrl} 
              alt={media.name || media.key} 
              className='image' 
              key={media.key} 
              style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
            />
          );
        }
      })}
    </div>
  );
}