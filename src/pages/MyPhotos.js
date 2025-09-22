import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyPhotosComponent from '../MyPhotos';
import logo from '../logo.png';
import '../styles/Navigation.css';

function MyPhotos() {
  const navigate = useNavigate();
  return (
    <div>
      <header className="App-header" style={{
        background: '#c9d9e8',
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

      <div style={{ 
        margin: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'fit-content',
        padding: '20px'
      }}>
        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'fit-content',
          padding: '10px',
          width: '100%'
        }}>
          <h3 style={{ 
            marginBottom: '10px', 
            color: '#5D4037', 
            textAlign: 'center',
            fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginTop: '0px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            View Photos
          </h3>
          <div className="nav-tab-container">
            <button 
              className="nav-tab-button"
            onClick={() => navigate('/')}
          >
            All Wedding Photos
            </button>
            <button 
              className="nav-tab-button selected"
              onClick={() => navigate('/my-photos')}
            >
              My Photos & Videos
            </button>
          </div>
        </div>
        <MyPhotosComponent />
      </div>
    </div>
  );
}

export default MyPhotos;