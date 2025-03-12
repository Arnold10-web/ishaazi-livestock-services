import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContentManagement = lazy(() => import('./ContentManagement'));

function getIconForTab(tab) {
  const icons = {
    blogs: 'file-alt',
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('myAppAdminToken');
    navigate('/login');
  };

  const tabs = [
    { id: 'blogs', label: 'Blogs' },
    { id: 'news', label: 'News' },
    { id: 'basics', label: 'Basics' },
    { id: 'magazines', label: 'Magazines' },
    { id: 'farms', label: 'Farms' },
    { id: 'goats', label: 'Goats' },
    { id: 'dairies', label: 'Dairies' },
    { id: 'beefs', label: 'Beef' },
    { id: 'piggeries', label: 'Piggery' },
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'subscribers', label: 'Subscribers' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 mr-3 rounded hover:bg-teal-500 lg:hidden transition duration-200"
          >
            <i className={`fas fa-${sidebarCollapsed ? 'bars' : 'times'}`}></i>
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            <i className="fas fa-tractor mr-2"></i>Ishaazi Livestock Services
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:block bg-teal-700 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
            <i className="fas fa-user-shield mr-1"></i>
            Admin Panel
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200 flex items-center"
          >
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className={`${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } fixed lg:relative lg:w-64 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out z-30 w-64 border-r border-gray-200`}>
          <div className="p-4 space-y-1">
            <div className="text-gray-600 font-medium py-2 px-4 mb-4 border-b border-gray-200">
              <i className="fas fa-th-large mr-2"></i>
              DASHBOARD
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center w-full py-3 px-4 rounded-md transition-colors duration-200 text-left ${
                  activeTab === tab.id 
                    ? 'bg-teal-50 text-teal-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <i className={`fas fa-${getIconForTab(tab.id)} mr-3 w-5 text-center ${
                  activeTab === tab.id ? 'text-teal-600' : 'text-gray-500'
                }`}></i>
                <span>{tab.label}</span>
                {activeTab === tab.id && <i className="fas fa-chevron-right ml-auto text-xs text-teal-600"></i>}
              </button>
            ))}
          </div>
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-gray-600 text-xs text-center">
              <p>© 2025 Ishaazi Livestock Services</p>
              <p>Version 2.0</p>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-0">
          {/* Backdrop for mobile sidebar */}
          {!sidebarCollapsed && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            ></div>
          )}
          
          {/* Tab Content */}
          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                <i className={`fas fa-${getIconForTab(activeTab)} mr-2 text-teal-600`}></i>
                {tabs.find(tab => tab.id === activeTab)?.label} Management
              </h2>
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600 flex items-center">
                <i className="fas fa-clock mr-2"></i> 
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300">
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <div className="w-16 h-16 relative">
                      <div className="w-16 h-16 border-4 border-teal-100 border-dashed rounded-full animate-spin"></div>
                      <div className="w-16 h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                  </div>
                }
              >
                <ContentManagement activeTab={activeTab} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;