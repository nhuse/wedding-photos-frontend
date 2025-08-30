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
    
    // Debug: Log the first file to see what fields are available
    if (photos.length > 0) {
      console.log('Sample photo file structure:', photos[0]);
      console.log('Photo file fields:', Object.keys(photos[0]));
    }
    if (videos.length > 0) {
      console.log('Sample video file structure:', videos[0]);
      console.log('Video file fields:', Object.keys(videos[0]));
    }
    
    // Convert photos to the format expected by ImageContainer
    const photoObjects = photos.map(file => {
      const mappedFile = {
        ...file,
        publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`,
        type: 'photo',
        // Ensure consistent field naming for display
        originalName: file.originalName || file.name || (() => {
          // If no original name, create a user-friendly name from the key
          const keyParts = file.key.split('.');
          const extension = keyParts.pop();
          const timestamp = keyParts[0];
          const date = new Date(parseInt(timestamp));
          return `Photo ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${extension}`;
        })()
      };
      console.log('Mapped photo file:', mappedFile);
      return mappedFile;
    });
    
    // Convert videos to the format expected by ImageContainer
    const videoObjects = videos.map(file => {
      const mappedFile = {
        ...file,
        publicUrl: `${process.env.REACT_APP_R2_WORKER_URL || 'https://wedding-photos-r2-worker.nate-huse1023.workers.dev'}/download?key=${encodeURIComponent(file.key)}`,
        type: 'video',
        // Ensure consistent field naming for display
        originalName: file.originalName || file.name || (() => {
          // If no original name, create a user-friendly name from the key
          const keyParts = file.key.split('.');
          const extension = keyParts.pop();
          const timestamp = keyParts[0];
          const date = new Date(parseInt(timestamp));
          return `Video ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${extension}`;
        })()
      };
      console.log('Mapped video file:', mappedFile);
      return mappedFile;
    });
    
    // Combine photos and videos, sort by upload date (most recent first), and take the 10 most recent
    const allMedia = [...photoObjects, ...videoObjects]
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      .slice(0, 10);
    
    console.log('Final allMedia array:', allMedia);
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
          <div style={{width: '90%'}}>
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
        return <MyPhotos onFileDeleted={loadMedia} />;
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



  return (
    <div className="App" style={{
      background: 'linear-gradient(135deg, #FEFEFE 0%, #FFE4B5 15%, #F5F5DC 85%, #F0F8FF 100%)',
      minHeight: '100vh',
      fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif'
    }}>
      <header className="App-header" style={{
        background: '#F5F5DC',
        borderBottom: '3px solid #6B7A8F',
        boxShadow: '0 4px 12px rgba(107, 122, 143, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'relative',
      }}>
        <img src={logo} style={{ 
          width: '150px', 
          height: '150px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          margin: '10px 0'
        }} alt="logo" />
        
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
          fontWeight: 'bold',
          color: '#5D4037',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
          zIndex: 1,
          fontSize: '3.5rem',
          marginBottom: '2%'
        }}>
          Nathan and Nayeli Huse's Wedding
        </span>
        
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '60%',
          fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#6B7A8F',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}>
          11/21/2025
        </span>
        
        {/* Invisible spacer to maintain layout balance */}
        <div style={{ width: '150px', visibility: 'hidden' }}></div>
      </header>
      
      {/* Upload Section - Separate Container */}
      <div style={{ 
        backgroundColor: 'white',
        margin: '10px 20px 20px 20px',
        borderRadius: '12px',
        border: '2px solid #6B7A8F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'fit-content',
        boxShadow: '0 4px 12px rgba(107, 122, 143, 0.2)',
        padding: '20px'
      }}>
        <h3 style={{ 
          marginBottom: '15px', 
          color: '#5D4037', 
          textAlign: 'center',
          fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
          fontWeight: 'bold',
          marginTop: '0px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          fontSize: '2.5rem'
        }}>
          Upload Your Wedding Memories
        </h3>
        <FileUploaderWorker onUploadSuccess={handleUploadSuccess} />
      </div>
      
      {/* Navigation & Photos Section - Combined */}
      <div style={{ 
        backgroundColor: 'white',
        margin: '0 20px 20px 20px',
        borderRadius: '12px',
        border: '2px solid #6B7A8F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'fit-content',
        boxShadow: '0 4px 12px rgba(107, 122, 143, 0.2)',
        padding: '20px'
      }}>
        {/* Navigation Section */}
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
        <div className="nav-tab-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <button 
            className={`nav-tab-button ${currentView === 'all-photos' ? 'selected' : ''}`}
            onClick={() => setCurrentView('all-photos')}
          >
            All Photos & Videos({imageObjects.length})
          </button>
          <button 
            className={`nav-tab-button ${currentView === 'my-photos' ? 'selected' : ''}`}
            onClick={() => setCurrentView('my-photos')}
          >
            My Photos & Videos
          </button>
        </div>
        
        {/* Divider */}
        <div style={{
          width: '80%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, #6B7A8F 50%, transparent 100%)',
          margin: '20px 0',
          opacity: 0.3
        }}></div>
        
        {/* Current View - Photos Display */}
        <div style={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {renderCurrentView}
        </div>
      </div>
      
      <div id="drag-drop-area"></div>
    </div>
  );
}

export default App;