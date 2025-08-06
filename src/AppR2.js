import logo from './logo.png';
import './App.css';
import FileUploaderWorker from './FileUploaderWorker';
import { useEffect, useState } from 'react';
import ImageContainer from './imageContainer';
import { listFilesFromR2ViaWorker } from './utils/r2Worker';

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
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL}/download?key=${encodeURIComponent(file.key)}&bucketType=photos`,
      type: 'photo'
    }));
    
    // Convert videos to the format expected by ImageContainer
    const videoObjects = videos.map(file => ({
      ...file,
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL}/download?key=${encodeURIComponent(file.key)}&bucketType=videos`,
      type: 'video'
    }));
    
    // Combine photos and videos, sort by upload date (most recent first), and take the 20 most recent
    const allMedia = [...photoObjects, ...videoObjects]
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      .slice(0, 20);
    
    return { imageObjects: allMedia, videoObjects: [] };
  } catch (error) {
    console.error('Error fetching R2 files:', error);
    return { imageObjects: [], videoObjects: [] };
  }
}

function AppR2() {
  const [imageObjects, setImageObjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const { imageObjects } = await getR2Files();
      setImageObjects(imageObjects);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} style={{ width: '250px', height: '250px' }} alt="logo" />
      </header>
      <div>
        <FileUploaderWorker onUploadSuccess={loadMedia} />
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading images and videos...
        </div>
      ) : (
        <div className='images-container'>
          <ImageContainer imageObjects={imageObjects} />
        </div>
      )}
    </div>
  );
}

export default AppR2; 