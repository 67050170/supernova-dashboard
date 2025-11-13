// src/Login.jsx
import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
  // ฟอร์มปกติ (เข้า Defence หรือ Offence ทีละอัน)
  const [cameraId, setCameraId] = useState('');
  const [token, setToken] = useState('');

  // ฟอร์ม Compare View
  const [showCompareForm, setShowCompareForm] = useState(false);
  const [defenceCameraId, setDefenceCameraId] = useState('');
  const [defenceToken, setDefenceToken] = useState('');
  const [offenceCameraId, setOffenceCameraId] = useState('');
  const [offenceToken, setOffenceToken] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 login ปกติ (ฝั่งเดียว)
  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: cameraId,
          token: token,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data || data.success === false) {
        setError(data?.message || 'Login failed');
      } else {
        // สมมติ backend ส่ง dashboard เป็น 'defence' หรือ 'offence'
        onLoginSuccess(data.dashboard);
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // 🟣 login แบบ Compare View (ใช้รหัสสองชุด)
  const handleCompareLogin = (e) => {
    e.preventDefault();
    setError('');

    if (
      !defenceCameraId.trim() ||
      !defenceToken.trim() ||
      !offenceCameraId.trim() ||
      !offenceToken.trim()
    ) {
      setError('กรุณากรอกกล้อง Defence และ Offence ให้ครบทุกช่อง');
      return;
    }

    // ตอนนี้ทำแบบง่าย ๆ: แค่บังคับให้กรอกครบทั้ง 2 ชุด
    // ถ้าอยากเช็กกับ backend จริง ๆ สามารถเพิ่ม fetch /api/login สองครั้งมาทีหลังได้
    onLoginSuccess('compare');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">🚀 Supernova Dashboard Login</h1>

        {/* error message */}
        {error && <div className="login-error">{error}</div>}

        {/* ฟอร์มปกติ */}
        {!showCompareForm && (
          <>
            <form onSubmit={handleNormalLogin} className="login-form">
              <div className="form-group">
                <label>Camera ID</label>
                <input
                  type="text"
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  placeholder="ใส่ Camera ID"
                />
              </div>

              <div className="form-group">
                <label>Token</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ใส่ Token"
                />
              </div>

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
              </button>
            </form>

            {/* ปุ่มเข้า Compare View */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                className="login-button secondary-button"
                onClick={() => {
                  setShowCompareForm(true);
                  setError('');
                }}
              >
                🛡️⚔️ Enter to Compare View
              </button>
            </div>
          </>
        )}

        {/* ฟอร์ม Compare View */}
        {showCompareForm && (
          <div className="compare-login">
            <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>
              🛡️⚔️ ใส่รหัส Defence + Offence
            </h2>

            <form onSubmit={handleCompareLogin} className="login-form">
              <div className="compare-section-title">🛡️ Defence</div>
              <div className="form-group">
                <label>Defence Camera ID</label>
                <input
                  type="text"
                  value={defenceCameraId}
                  onChange={(e) => setDefenceCameraId(e.target.value)}
                  placeholder="กล้องสำหรับ Defence"
                />
              </div>
              <div className="form-group">
                <label>Defence Token</label>
                <input
                  type="password"
                  value={defenceToken}
                  onChange={(e) => setDefenceToken(e.target.value)}
                  placeholder="Token Defence"
                />
              </div>

              <div className="compare-section-title">⚔️ Offence</div>
              <div className="form-group">
                <label>Offence Camera ID</label>
                <input
                  type="text"
                  value={offenceCameraId}
                  onChange={(e) => setOffenceCameraId(e.target.value)}
                  placeholder="กล้องสำหรับ Offence"
                />
              </div>
              <div className="form-group">
                <label>Offence Token</label>
                <input
                  type="password"
                  value={offenceToken}
                  onChange={(e) => setOffenceToken(e.target.value)}
                  placeholder="Token Offence"
                />
              </div>

              <button type="submit" className="login-button">
                ✅ เข้าสู่ Compare View
              </button>

              <button
                type="button"
                className="login-button secondary-button"
                style={{ marginTop: '8px' }}
                onClick={() => {
                  setShowCompareForm(false);
                  setError('');
                }}
              >
                ⬅ กลับไปหน้า Login ปกติ
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
