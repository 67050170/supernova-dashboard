// src/CompareDashboard.jsx
import React from 'react';
import DefenceDashboard from './DefenceDashboard';
import AnotherDashboard from './AnotherDashboard';
import './App.css';

function CompareDashboard({ onLogout }) {
  return (
    <div className="App">
      <header className="app-header">
        <h1>🛰️ Defence vs Offence – Compare View</h1>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '16px',
          height: 'calc(100vh - 80px)',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.35)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontWeight: 600,
            }}
          >
            🛡️ Defence
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {/* ไม่ยุ่ง logic ข้างใน dashboard เดิมเลย */}
            <DefenceDashboard onLogout={() => {}} />
          </div>
        </section>

        <section
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.35)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontWeight: 600,
            }}
          >
            ⚔️ Offence
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AnotherDashboard onLogout={() => {}} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default CompareDashboard;
