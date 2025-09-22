import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import MyPhotos from './pages/MyPhotos';
import AccessDenied from './pages/AccessDenied';
import PasswordEntry from './pages/PasswordEntry';
import VerifyAuth from './pages/VerifyAuth';

// Import components
import ProtectedRoute from './components/ProtectedRoute';

// Import auth configuration
import { AUTH_URLS } from './config/auth';

function App() {
  const navigate = useNavigate();

  const handleUploadSuccess = () => {
    // After successful upload, refresh the home page
    navigate('/');
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Home onUploadSuccess={handleUploadSuccess} />
          </ProtectedRoute>
        } />
        <Route path="/my-photos" element={
          <ProtectedRoute>
            <MyPhotos />
          </ProtectedRoute>
        } />
        <Route path={AUTH_URLS.PASSWORD_ENTRY} element={<PasswordEntry />} />
        <Route path={AUTH_URLS.ACCESS_DENIED} element={<AccessDenied />} />
        <Route path={AUTH_URLS.AUTH_ENDPOINT} element={<VerifyAuth />} />
      </Routes>
      <div id="drag-drop-area"></div>
    </div>
  );
}

export default App;