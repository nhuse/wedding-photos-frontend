import logo from './logo.png';
import './App.css';
import FileUploader from './FileUploader';
import { useUppyWithSupabase } from './hooks/useUppyWithSupabase';
import { supabase } from './utils/supabase';
import { useEffect, useState } from 'react';
import ImageContainer from './imageContainer';

async function getAllImagePublicUrls() {
  const { data: images, error: imagesError } = await supabase.storage.from('images').list('', { limit: 1000 });
  const { data: videos, error: videosError } = await supabase.storage.from('videos').list('', { limit: 1000 });
  if (imagesError || videosError) {
    console.error('Error listing images:', imagesError || videosError);
    return { imageObjects: [], videoObjects: [] };
  }
  // Filter for image files (optional)
  const imageFiles = images.filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  // Add publicUrl to each image object
  const imageObjects = imageFiles.map(file => {
    console.log(file);
    const { data } = supabase.storage.from('images').getPublicUrl(file.name);
    console.log(data);
    return { ...file, publicUrl: data.publicUrl };
  });
  // Add publicUrl to each video object
  const videoObjects = videos.map(file => {
    const { data } = supabase.storage.from('videos').getPublicUrl(file.name);
    console.log(data);
    return { ...file, publicUrl: data.publicUrl };
  });
  return { imageObjects, videoObjects };
}
function App() {
  const uppy = useUppyWithSupabase();
  const [imageObjects, setImageObjects] = useState([]);
  const [videoObjects, setVideoObjects] = useState([]);
  useEffect(() => {
    getAllImagePublicUrls().then(({ imageObjects, videoObjects }) => {
      setImageObjects(imageObjects);
      setVideoObjects(videoObjects);
    });
  }, []);
  console.log(imageObjects, videoObjects);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} style={{ width: '250px', height: '250px' }} alt="logo" />
      </header>
      <div>
        <FileUploader uppy={uppy} />
      </div>
      <div className='images-container'>
        <ImageContainer imageObjects={imageObjects} />
      </div>
      <div id="drag-drop-area"></div>
    </div>
  );
}

export default App;