// src/Login.jsx 

import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
  // 🔥 default เป็น Offence เพื่อเทสง่าย
  // อยากเปลี่ยนเป็น Defence ก็แค่สลับค่าตรงนี้
  const [cameraId, setCameraId] = useState('9d7d4113-7a56-4298-8fb2-c71c4bcc0187');
  const [token, setToken] = useState('ff8b6d81-bbf6-40b2-90de-5e392d77e348');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError('');
    setIsLoading(true);

    try {
      // ⭐ ใช้ relative path → รองรับ deploy, ไม่ล็อกที่ localhost
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cameraId, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setError('');

      // ⭐ ส่ง dashboard ('defence' / 'offence') ไปให้ App.jsx
      onLoginSuccess(data.dashboard);

    } catch (err) {
      setError(err.message || 'Camera ID หรือ Token ไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">TEAM SuperNova</h1>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="camera-id">Camera ID</label>
            <input
              type="text"
              id="camera-id"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="token">Token</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
