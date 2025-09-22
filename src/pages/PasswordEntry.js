import React, { useState } from 'react';
import { AUTH_URLS } from '../config/auth';
import logo from '../logo.png';

const PasswordEntry = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Redirect to the auth endpoint with the entered password as the token
      window.location.href = `${AUTH_URLS.AUTH_ENDPOINT}?token=${encodeURIComponent(password)}`;
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

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
          Wedding Photos Access
        </h3>
        <p style={{
          fontSize: '1.2rem',
          color: '#6B7A8F',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          Please enter the password to access the wedding photos.
        </p>
        
        <form onSubmit={handleSubmit} style={{
          width: '100%',
          maxWidth: '300px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #6B7A8F',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          {error && <div style={{
            color: '#dc3545',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            {error}
          </div>}
          
          <button type="submit" style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6B7A8F',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Access Photos
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordEntry;
