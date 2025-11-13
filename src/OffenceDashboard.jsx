// src/AnotherDashboard.jsx

import React, { useCallback, useState, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import MapComponent from './MapComponent';
import './App.css';

const getDroneInfoImageUrl = (size) => {
  switch (size) {
    case 'small':
      return '/small.png';
    case 'medium':
      return '/medium.png';
    case 'large':
      return '/large.png';
    default:
      return '/Drone.png';
  }
};

// ใช้ reducer แบบเดียวกับ Defence แต่ใช้สำหรับโหมดโจมตี (Offence)
const droneStateReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FROM_AI': {
      const aiData = action.payload;
      const existingDroneIndex = state.allDrones.findIndex(d => d.id === aiData.id);
      const droneWithImages = { 
        ...aiData, 
        mapIconUrl: '/Drone.png',
        imageUrl: getDroneInfoImageUrl(aiData.size)
      };
      let newDrones = [...state.allDrones];

      if (existingDroneIndex !== -1) {
        newDrones[existingDroneIndex] = { 
          ...newDrones[existingDroneIndex], 
          ...droneWithImages, 
          visible: true, 
          lastSeen: Date.now() 
        };
      } else {
        newDrones.push({ 
          ...droneWithImages, 
          visible: true, 
          lastSeen: Date.now() 
        });
      }

      return {
        ...state,
        allDrones: newDrones,
        displayedDroneId: aiData.id,
      };
    }
    case 'SET_CLICKED_DRONE':
      return { ...state, displayedDroneId: action.payload?.id || state.displayedDroneId };
    case 'CYCLE_DRONE': {
      const currentVisible = state.allDrones.filter(d => d.visible);
      if (currentVisible.length === 0) return state;
      const currentIndex = currentVisible.findIndex(d => d.id === state.displayedDroneId);
      const nextIndex = (currentIndex + action.payload.direction + currentVisible.length) % currentVisible.length;
      return { ...state, displayedDroneId: currentVisible[nextIndex].id };
    }
    case 'HIDE_OLD_DRONES': {
      const now = Date.now();
      const newDrones = state.allDrones.map(drone => ({
        ...drone,
        visible: (now - drone.lastSeen) < action.payload.timeout,
      }));
      const displayedDroneIsVisible = newDrones.some(d => d.id === state.displayedDroneId && d.visible);
      const newDisplayedId = displayedDroneIsVisible ? state.displayedDroneId : newDrones.find(d => d.visible)?.id || null;
      return { ...state, allDrones: newDrones, displayedDroneId: newDisplayedId };
    }
    case 'UPDATE_DRONE_NFZ_STATUS': {
      const { droneId, isInNFZ } = action.payload;
      const droneIndex = state.allDrones.findIndex(d => d.id === droneId);
      if (droneIndex === -1) return state;

      const newDrones = [...state.allDrones];
      const updatedDrone = { ...newDrones[droneIndex], isInNFZ };
      newDrones[droneIndex] = updatedDrone;

      return {
        ...state,
        allDrones: newDrones,
      };
    }
    default:
      return state;
  }
};

// Custom Hook สำหรับเชื่อม Socket
const useSocket = (camId, enabled) => {
  const [realtimeData, setRealtimeData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !camId) return;

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected (Offence)');
      setIsConnected(true);
      socketInstance.emit('subscribe_camera', { cam_id: camId });
    });

    socketInstance.on('object_detection', (data) => {
      console.log('Offence received real-time data:', data);
      setRealtimeData(data);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected (Offence)');
      setIsConnected(false);
    });

    return () => socketInstance.disconnect();
  }, [camId, enabled]);

  return { realtimeData, isConnected };
};

function AnotherDashboard({ onLogout }) {
  const [logMessages, setLogMessages] = useState([]);
  // โหมดโจมตี: เก็บเป้าหมายที่อยู่ใน “พื้นที่ปฏิบัติการโจมตี”
  const [targetsInEngagementZone, setTargetsInEngagementZone] = useState([]);
  const [isImagePopupVisible, setIsImagePopupVisible] = useState(false);
  const [popupDrone, setPopupDrone] = useState(null);

  // ฟังก์ชันเพิ่ม Log
  const addLogMessage = useCallback((message) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      message: message,
    };
    setLogMessages(prevLogs => [newLog, ...prevLogs].slice(0, 50));
  }, []);

  // เมื่อเป้าหมายเข้า “พื้นที่ปฏิบัติการโจมตี”
  const handleEnterEngagementZone = useCallback((drone) => {
    setTargetsInEngagementZone(prev => {
      if (!prev.includes(drone.id)) {
        // ใช้ NFZ flag เดิม แต่ตีความเป็น “ในเขตปฏิบัติการโจมตี”
        dispatchDroneState({ 
          type: 'UPDATE_DRONE_NFZ_STATUS', 
          payload: { droneId: drone.id, isInNFZ: true } 
        });
        addLogMessage(`🎯 เป้าหมาย ID: ${drone.id} เข้าสู่พื้นที่ปฏิบัติการโจมตี`);
        return [...prev, drone.id];
      }
      return prev;
    });
  }, [addLogMessage]);

  // เมื่อเป้าหมายออกจาก “พื้นที่ปฏิบัติการโจมตี”
  const handleExitEngagementZone = useCallback((drone) => {
    addLogMessage(`✅ เป้าหมาย ID: ${drone.id} ออกจากพื้นที่ปฏิบัติการโจมตี`);
    dispatchDroneState({ 
      type: 'UPDATE_DRONE_NFZ_STATUS', 
      payload: { droneId: drone.id, isInNFZ: false } 
    });
    setTargetsInEngagementZone(prev => prev.filter(id => id !== drone.id));
  }, [addLogMessage]);

  // ใช้ useReducer จัดการ State เป้าหมาย (โดรน)
  const [droneState, dispatchDroneState] = useReducer(droneStateReducer, {
    allDrones: [],
    displayedDroneId: null,
  });
  const { allDrones, displayedDroneId } = droneState;

  // กล้องสำหรับโหมดโจมตี (Offence)
  // ใช้ค่า camera id ที่เคยให้ไว้กับโหมด Another / Offence
  const camId = '9d7d4113-7a56-4298-8fb2-c71c4bcc0187';
  const { realtimeData } = useSocket(camId, true);

  // เมื่อได้ real-time data จาก AI
  useEffect(() => {
    if (realtimeData) {
      addLogMessage(`📡 [REAL-TIME] AI ตรวจจับเป้าหมายจากกล้อง: ${realtimeData.camera_id}`);
      if (realtimeData.id) {
        dispatchDroneState({ type: 'UPDATE_FROM_AI', payload: realtimeData });
      }
    }
  }, [realtimeData, addLogMessage]);

  // ซ่อนเป้าหมายที่หายไปนาน (ขาดการติดต่อ)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatchDroneState({ type: 'HIDE_OLD_DRONES', payload: { timeout: 10000 } });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const displayedDrone = allDrones.find(d => d.id === displayedDroneId);

  const handleCycleDrone = (direction) => {
    const dir = direction === 'next' ? 1 : -1;
    dispatchDroneState({ type: 'CYCLE_DRONE', payload: { direction: dir } });
  };

  const handleImageClick = (drone) => {
    setPopupDrone(drone);
    setIsImagePopupVisible(true);
  };

  return (
    <div className="App">
      <header>
        <h1>⚔️ Offence Dashboard</h1>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </header>

      <div className="dashboard-layout">
        <div className="map-panel">
          <MapComponent
            drones={allDrones}
            onDroneChange={(drone) => dispatchDroneState({ type: 'SET_CLICKED_DRONE', payload: drone })}
            onLog={addLogMessage}
            onEnterNoFlyZone={handleEnterEngagementZone}   // reuse NFZ event เป็น “เขตปฏิบัติการโจมตี”
            onExitNoFlyZone={handleExitEngagementZone}
            displayedDroneId={displayedDroneId}
          />
        </div>

        <div className="side-panel">
          {/* แจ้งเตือนเมื่อมีเป้าหมายในพื้นที่ปฏิบัติการโจมตี */}
          {targetsInEngagementZone.length > 0 && (
            <div className="persistent-alert-container">
              <div className="persistent-alert">
                <div className="alert-title">⚠️ เป้าหมายในพื้นที่ปฏิบัติการโจมตี</div>
                <div className="alert-body">
                  ID เป้าหมาย: {targetsInEngagementZone.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Log เหตุการณ์ */}
          <div className="info-box" style={{ display: 'flex', flexDirection: 'column', color: '#000' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', flexShrink: 0, color: '#000' }}>
              บันทึกภารกิจ (โหมดโจมตี)
            </h3>
            <div style={{ flexGrow: 1, overflowY: 'auto', fontSize: '13px', fontFamily: 'monospace' }}>
              {logMessages.length > 0 ? (
                logMessages.map(log => (
                  <div
                    key={log.id}
                    style={{ marginBottom: '6px', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px', color: '#000' }}
                  >
                    <span style={{ color: '#888' }}>[{log.timestamp.toLocaleTimeString('th-TH')}]</span> {log.message}
                  </div>
                ))
              ) : (
                <div style={{ color: '#000', textAlign: 'center', paddingTop: '20px' }}>
                  ยังไม่มีภารกิจ...
                </div>
              )}
            </div>
          </div>

          {/* กล่องรายละเอียดเป้าหมาย */}
          <div className="info-box" style={{ textAlign: 'center', padding: '24px' }}>
            {displayedDrone ? (
              <>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#000' }}>
                  รายละเอียดเป้าหมาย ID {displayedDrone.id}
                </h3>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                >
                  <img
                    src={displayedDrone.imageUrl || "/Drone.png"}
                    onClick={() => handleImageClick(displayedDrone)}
                    alt={`เป้าหมาย ${displayedDrone.id}`}
                    style={{
                      width: '100%',
                      maxWidth: '150px',
                      height: 'auto',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    textAlign: 'left',
                    background: '#f9f9f9',
                    padding: '12px',
                    borderRadius: '6px',
                    color: '#000'
                  }}
                >
                  <div><strong>ID:</strong> {displayedDrone.id}</div>
                  <div><strong>ขนาด:</strong> {displayedDrone.size}</div>
                  <div><strong>พิกัด:</strong> {displayedDrone.lat.toFixed(4)}, {displayedDrone.lng.toFixed(4)}</div>
                  <div><strong>ความสูง:</strong> {displayedDrone.alt ? `${displayedDrone.alt.toFixed(1)} m` : 'N/A'}</div>
                </div>
                {allDrones.filter(d => d.visible).length > 1 && (
                  <div className="drone-cycle-controls">
                    <button onClick={() => handleCycleDrone('prev')}>
                      &lt; เป้าหมายก่อนหน้า
                    </button>
                    <button onClick={() => handleCycleDrone('next')}>
                      เป้าหมายถัดไป &gt;
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <p>คลิกที่เป้าหมายบนแผนที่เพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up แสดงรูปเป้าหมายขนาดใหญ่ */}
      {isImagePopupVisible && popupDrone && (
        <div className="drone-modal-backdrop" onClick={() => setIsImagePopupVisible(false)}>
          <div
            className="drone-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '80vw',
              maxHeight: '80vh',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button className="drone-modal-close-button" onClick={() => setIsImagePopupVisible(false)}>
              &times;
            </button>
            <img
              src={popupDrone.imageUrl || "/Drone.png"}
              alt={`เป้าหมาย ${popupDrone.id}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AnotherDashboard;
