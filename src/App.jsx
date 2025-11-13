// src/App.jsx
import React, { useState } from 'react';
import Login from './Login';
import DefenceDashboard from './DefenceDashboard';
import AnotherDashboard from './AnotherDashboard';
import CompareDashboard from './CompareDashboard';
import './App.css';
import './Login.css';

function App() {
  // null = ยังไม่ได้ login
  // 'defence' = Defence Dashboard
  // 'offence' = Offence Dashboard
  // 'compare' = Compare View ใหม่
  const [dashboardType, setDashboardType] = useState(null);

  const handleLogout = () => {
    setDashboardType(null);
  };

  const handleLoginSuccess = (type) => {
    // type จะเป็น 'defence' | 'offence' | 'compare'
    setDashboardType(type);
  };

  if (dashboardType === 'defence') {
    return <DefenceDashboard onLogout={handleLogout} />;
  }

  if (dashboardType === 'offence') {
    return <AnotherDashboard onLogout={handleLogout} />;
  }

  if (dashboardType === 'compare') {
    return <CompareDashboard onLogout={handleLogout} />;
  }

  // ยังไม่ login → แสดงหน้า Login
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;
