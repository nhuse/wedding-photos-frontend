import React, { useState } from 'react';
import { AUTH_URLS } from '../config/auth';

function AccessDenied() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Redirect to the auth endpoint with the entered password as the token
    window.location.href = `${AUTH_URLS.AUTH_ENDPOINT}?token=${encodeURIComponent(password)}`;
  };

  return (
    <div style={{ 
      backgroundColor: 'white',
      margin: '20px',
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
        marginBottom: '20px', 
        color: '#5D4037', 
        textAlign: 'center',
        fontFamily: '"Dancing Script", "Playfair Display", "Georgia", serif',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginTop: '0px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}>
        Access Denied
      </h3>
      <p style={{
        fontSize: '1.2rem',
        color: '#6B7A8F',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        Sorry, you don't have permission to access this page. Please make sure you have a valid QR code or enter the password provided by the bride and groom.
      </p>
      
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '300px',
        marginTop: '20px'
      }}>
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
            marginBottom: '10px',
            fontSize: '1rem'
          }}
        />
        
        {error && <div style={{
          color: '#dc3545',
          marginBottom: '10px',
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
          Try Access
        </button>
      </form>
    </div>
  );
}

export default AccessDenied;
