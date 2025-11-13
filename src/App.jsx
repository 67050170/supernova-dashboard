// src/App.jsx
import React, { useState } from 'react';
import Login from './Login';
import DefenceDashboard from './DefenceDashboard';
import AnotherDashboard from './AnotherDashboard';
import CompareDashboard from './CompareDashboard';
import './App.css';
import './Login.css';

function App() {
  // null, 'defence', 'offence', 'compare'
  const [dashboardType, setDashboardType] = useState(null);

  const handleLogout = () => {
    setDashboardType(null);
  };

  // รับประเภท dashboard จากหน้า Login
  const handleLoginSuccess = (type) => {
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

  // ยังไม่ login
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;
