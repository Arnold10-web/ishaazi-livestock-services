import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/admin.css';

const ContentManagement = lazy(() => import('./ContentManagement'));

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('blogs');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('myAppAdminToken');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </header>
      <div className="dashboard-content">
        <nav className="admin-nav">
          {['blogs', 'news', 'basics', 'magazines', 'farms','goats','dairies','beefs','piggeries' ,'newsletters', 'subscribers'].map((tab) => (
            <button
              key={tab}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <i className={`fas fa-${getIconForTab(tab)}`}></i>
              {`${tab.charAt(0).toUpperCase()}${tab.slice(1)} Management`}
            </button>
          ))}
        </nav>
        <div className="tab-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <ContentManagement activeTab={activeTab} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

function getIconForTab(tab) {
  const icons = {
    'blogs': 'blog',
    'news': 'newspaper',
    'basics': 'photo-video',
    'magazines': 'book',
    'farms': 'tractor',
    'goats': 'paw',
    'dairies': 'cheese',
    'beefs': 'drumstick-bite',
    'piggeries': 'piggy-bank',
     'newsletters': 'envelope',
    'subscribers': 'users'
  };
  return icons[tab] || 'cog';
}

export default AdminDashboard;