// src/CompareDashboard.jsx
import React from 'react';
import DefenceDashboard from './DefenceDashboard';
import AnotherDashboard from './AnotherDashboard';
import './App.css';

function CompareDashboard({ onLogout }) {
  return (
    <div className="App">
      <header>
        <h1>🛡️⚔️ Compare View (Defence vs Offence)</h1>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </header>

      {/* สองคอลัมน์: ซ้าย = Defence, ขวา = Offence */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'stretch',
          padding: '16px',
        }}
      >
        <div style={{ flex: 1, border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
          <h2 style={{ margin: '8px 12px' }}>🛡️ Defence</h2>
          <DefenceDashboard onLogout={onLogout} />
        </div>

        <div style={{ flex: 1, border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
          <h2 style={{ margin: '8px 12px' }}>⚔️ Offence</h2>
          <AnotherDashboard onLogout={onLogout} />
        </div>
      </div>
    </div>
  );
}

export default CompareDashboard;
