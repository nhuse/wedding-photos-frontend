import React, { useState } from 'react';
import './FileUploader.css';
function FileUploader() {
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newPreviews = files.map(file => {
      const url = URL.createObjectURL(file);
      return { file, url };
    });
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(prev[indexToRemove].url);
      return newPreviews;
    });
  };

  const handleUpload = () => {
    console.log(previews);
    setPreviews([]);
  };

  return (
    <div className='file-uploader'>
      <h2 className='file-uploader-title'>Select Your Photos and Videos</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label
          htmlFor="file-input"
          style={{
            padding: '6px 12px',
            backgroundColor: '#6699CC',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-block',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        >
          Add Images and Videos
        </label>
        {previews.length > 0 && (
          <span className='file-uploader-selected-files'>
            {previews.length} file{previews.length === 1 ? '' : 's'} selected
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16 }}>
        {previews.map((preview, idx) => {
          if (preview.file.type.startsWith('image/')) {
            return (
              <div key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }}
                />
                <button
                  onClick={() => removeFile(idx)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            );
          } else if (preview.file.type.startsWith('video/')) {
            return (
              <div key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <video
                  src={preview.url}
                  controls
                  style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }}
                />
                <button
                  onClick={() => removeFile(idx)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
      {previews.length > 0 && <button onClick={handleUpload}>Publish Your Photos and Videos</button>}
    </div>
  );
}

export default FileUploader; 