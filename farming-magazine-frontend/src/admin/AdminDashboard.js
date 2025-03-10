import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContentManagement = lazy(() => import('./ContentManagement'));

function getIconForTab(tab) {
  const icons = {
    blogs: 'blog',
    news: 'newspaper',
    basics: 'photo-video',
    magazines: 'book',
    farms: 'tractor',
    goats: 'paw',
    dairies: 'cheese',
    beefs: 'drumstick-bite',
    piggeries: 'piggy-bank',
    newsletters: 'envelope',
    subscribers: 'users'
  };
  return icons[tab] || 'cog';
}

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <nav className="w-64 bg-blue-800 p-4 space-y-2">
          {[
            'blogs',
            'news',
            'basics',
            'magazines',
            'farms',
            'goats',
            'dairies',
            'beefs',
            'piggeries',
            'newsletters',
            'subscribers'
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center w-full py-2 px-3 rounded transition-colors duration-200 text-left ${
                activeTab === tab ? 'bg-blue-600' : 'hover:bg-blue-700'
              } text-gray-100`}
            >
              <i className={`fas fa-${getIconForTab(tab)} mr-2`}></i>
              {`${tab.charAt(0).toUpperCase()}${tab.slice(1)} Management`}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 p-6 m-4 bg-white rounded-lg shadow-md transition-all duration-300">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-48">
                <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
              </div>
            }
          >
            <ContentManagement activeTab={activeTab} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
