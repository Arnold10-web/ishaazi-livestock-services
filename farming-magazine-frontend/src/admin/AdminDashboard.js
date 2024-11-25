import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/admin.css';

const ContentManagement = lazy(() => import('./ContentManagement'));

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('blogs'); // Default to blogs
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken'); // Retrieve the correct token
    if (!token) navigate('/login'); // Redirect to login if not authenticated
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('myAppAdminToken'); // Clear the correct token
    navigate('/login');
  };

  return (
    <div className="admin-dashboard container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <nav className="admin-nav">
        {['blogs', 'news', 'media', 'magazines', 'farms'].map((tab) => (
          <button
            key={tab}
            className={`nav-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {`${tab.charAt(0).toUpperCase()}${tab.slice(1)} Management`}
          </button>
        ))}
      </nav>
      <div className="tab-content">
        <Suspense fallback={<div>Loading...</div>}>
          <ContentManagement activeTab={activeTab} />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;
