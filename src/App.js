import logo from './logo.png';
import './App.css';
import FileUploaderWorker from './FileUploaderWorker';
import MyPhotos from './MyPhotos';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}&bucketType=photos`,
      type: 'photo'
    }));
    
    // Convert videos to the format expected by ImageContainer
    const videoObjects = videos.map(file => ({
      ...file,
      publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}&bucketType=videos`,
      type: 'video'
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

function App() {
  const [imageObjects, setImageObjects] = useState([]);
  const [currentView, setCurrentView] = useState('all-photos'); // 'all-photos', 'my-photos'
  const [loading, setLoading] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  const loadMedia = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const { imageObjects } = await getR2Files();
      setImageObjects(imageObjects);
      setLastLoadTime(Date.now());
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Remove lastLoadTime dependency to prevent infinite loop

  useEffect(() => {
    loadMedia();
  }, []); // Only run once on mount

  const handleUploadSuccess = useCallback(() => {
    // Force refresh after upload
    loadMedia(true);
  }, [loadMedia]);

  const renderCurrentView = useMemo(() => {
    switch (currentView) {
      case 'all-photos':
        return (
          <div className='images-container'>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Loading images and videos...</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  This may take a moment on first load
                </div>
              </div>
            ) : (
              <ImageContainer imageObjects={imageObjects} />
            )}
          </div>
        );
      case 'my-photos':
        return <MyPhotos />;
      default:
        return (
          <div className='images-container'>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Loading images and videos...</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  This may take a moment on first load
                </div>
              </div>
            ) : (
              <ImageContainer imageObjects={imageObjects} />
            )}
          </div>
        );
    }
  }, [currentView, loading, imageObjects]);

  const getNavButtonStyle = useCallback((view) => ({
    padding: '12px 24px',
    backgroundColor: currentView === view ? '#4caf50' : '#6699cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    margin: '0 8px',
    transition: 'background-color 0.3s ease'
  }), [currentView]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} style={{ width: '250px', height: '250px' }} alt="logo" />
      </header>
      
      {/* Upload Section - Always Visible */}
      <div style={{ 
        
        backgroundColor: '#f8f9fa',
        margin: '10px 20px 0 20px',
        borderRadius: '8px 8px 0 0',
        borderTop: '1px solid #e9ecef',
        borderRight: '1px solid #e9ecef',
        borderLeft: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'fit-content'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333', textAlign: 'center' }}>
          Upload Your Wedding Photos & Videos
        </h3>
        <FileUploaderWorker onUploadSuccess={handleUploadSuccess} />
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ 
        textAlign: 'center',
        margin: '0 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        borderRight: '1px solid #e9ecef',
        borderLeft: '1px solid #e9ecef',
        paddingBottom: '20px',
        height: 'fit-content',
        borderRadius: '0 0 8px 8px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333', marginTop: '0px' }}>Wedding Photo Gallery</h3>
        <div>
          <button 
            onClick={() => setCurrentView('all-photos')}
            style={getNavButtonStyle('all-photos')}
          >
            📸 All Photos ({imageObjects.length})
          </button>
          <button 
            onClick={() => setCurrentView('my-photos')}
            style={getNavButtonStyle('my-photos')}
          >
            👤 My Photos
          </button>
        </div>
      </div>

      {/* Current View */}
      <div>
        {renderCurrentView}
      </div>
      
      <div id="drag-drop-area"></div>
    </div>
  );
}

export default App;