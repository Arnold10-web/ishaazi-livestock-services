import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContentManagement = lazy(() => import('./ContentManagement'));
const AuctionManagement = lazy(() => import('./AuctionManagement'));
// New component imports
const Overview = lazy(() => import('../components/Overview'));
const EmailTesting = lazy(() => import('./EmailTesting'));
const EmailAnalytics = lazy(() => import('./EmailAnalytics'));
const NotificationManagement = lazy(() => import('./NotificationManagement'));
const PerformanceDashboard = lazy(() => import('../components/PerformanceDashboard'));
const SecurityDashboard = lazy(() => import('../components/SecurityDashboard'));

function getIconForTab(tab) {
  const icons = {
    overview: 'chart-pie',
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
    subscribers: 'users',
    events: 'calendar-alt',
    auctions: 'gavel',
    'email-testing': 'envelope-open-text',
    'email-analytics': 'chart-line',
    'notifications': 'bell',
    'performance': 'tachometer-alt'
  };
  return icons[tab] || 'cog';
}

const AdminDashboard = () => {
  // Set default tab to overview
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Add dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken');
    if (!token) navigate('/login');
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [navigate]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('myAppAdminToken');
    navigate('/login');
  };

  // Add overview tab
  const tabs = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'news', label: 'News' },
    { id: 'basics', label: 'Basics' },
    { id: 'magazines', label: 'Magazines' },
    { id: 'farms', label: 'Farms' },
    { id: 'goats', label: 'Goats' },
    { id: 'dairies', label: 'Dairies' },
    { id: 'beefs', label: 'Beef' },
    { id: 'piggeries', label: 'Piggery' },
    { id: 'auctions', label: 'Auctions' },
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'subscribers', label: 'Subscribers' },
    { id: 'events', label: 'Events' },
    { id: 'email-testing', label: 'Email Testing' },
    { id: 'email-analytics', label: 'Email Analytics' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'performance', label: 'Performance Dashboard' },
    { id: 'security', label: 'Security' },
  ];

  // Generate breadcrumb based on active tab
  const getBreadcrumb = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return (
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span className="hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition">Dashboard</span>
        <i className="fas fa-chevron-right mx-2 text-xs text-gray-400"></i>
        <span className="text-teal-600 dark:text-teal-400 font-medium">{currentTab?.label}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} flex flex-col font-sans transition-colors duration-300`}>
      {/* Header - modern design without gradient */}
      <header className={`${darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'} 
        border-b px-6 py-4 shadow-sm flex justify-between items-center transition-colors duration-300`}>
        <div className="flex items-center">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 mr-3 rounded-full ${darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-700'} 
              lg:hidden transition duration-200`}
          >
            <i className={`fas fa-${sidebarCollapsed ? 'bars' : 'times'}`}></i>
          </button>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="fas fa-tractor mr-2 text-teal-600"></i>
            <span className="hidden sm:inline">Ishaazi Livestock Services</span>
            <span className="sm:hidden">Ishaazi</span>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className={`relative p-2 rounded-full ${darkMode 
            ? 'hover:bg-gray-700 text-gray-300' 
            : 'hover:bg-gray-100 text-gray-700'} transition duration-200`}>
            <i className="fas fa-bell"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Dark mode toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode 
              ? 'hover:bg-gray-700 text-yellow-300' 
              : 'hover:bg-gray-100 text-gray-700'} transition duration-200`}
          >
            <i className={`fas fa-${darkMode ? 'sun' : 'moon'}`}></i>
          </button>
          
          <div className={`hidden md:block ${darkMode 
            ? 'bg-gray-700 text-gray-200' 
            : 'bg-teal-50 text-teal-700'} 
            px-3 py-1 rounded-full text-sm font-medium`}>
            <i className="fas fa-user-shield mr-1"></i>
            Admin Panel
          </div>
          <button
            onClick={handleLogout}
            className={`bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200 flex items-center`}
          >
            <i className="fas fa-sign-out-alt mr-2"></i> 
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar - Fixed for scrolling */}
        <nav className={`${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } fixed lg:relative lg:w-64 h-screen ${darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'} 
        border-r transition-transform duration-300 ease-in-out z-30 w-64 flex flex-col`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium py-2 px-2`}>
              <i className="fas fa-th-large mr-2"></i>
              NAVIGATION
            </div>
          </div>
          
          {/* Scrollable tabs container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center w-full py-3 px-4 rounded-md transition-all duration-200 text-left ${
                  activeTab === tab.id 
                    ? darkMode 
                      ? 'bg-teal-800 bg-opacity-30 text-teal-400 font-medium' 
                      : 'bg-teal-50 text-teal-700 font-medium' 
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <i className={`fas fa-${getIconForTab(tab.id)} mr-3 w-5 text-center ${
                  activeTab === tab.id 
                    ? 'text-teal-500' 
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <i className="fas fa-chevron-right ml-auto text-xs text-teal-500"></i>
                )}
              </button>
            ))}
          </div>
          
          {/* Footer stays at bottom */}
          <div className={`p-4 border-t ${darkMode 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-gray-50'}`}>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs text-center`}>
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
          <div className={`p-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {/* Breadcrumb */}
            {getBreadcrumb()}
            
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2 md:mb-0`}>
                <i className={`fas fa-${getIconForTab(activeTab)} mr-2 text-teal-500`}></i>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
              <div className={`${darkMode 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gray-100 text-gray-600'} 
                rounded-lg p-3 text-sm flex items-center transition-colors duration-300`}>
                <i className="fas fa-clock mr-2"></i> 
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>

            <div className={`${darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'} 
              rounded-xl shadow-sm border p-6 transition-all duration-300`}>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <div className="w-16 h-16 relative">
                      <div className={`w-16 h-16 border-4 ${darkMode 
                        ? 'border-gray-700' 
                        : 'border-teal-100'} border-dashed rounded-full animate-spin`}></div>
                      <div className="w-16 h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                  </div>
                }
              >
                {activeTab === 'overview' ? (
                  <Overview darkMode={darkMode} />
                ) : activeTab === 'auctions' ? (
                  <AuctionManagement />
                ) : activeTab === 'email-testing' ? (
                  <EmailTesting />
                ) : activeTab === 'email-analytics' ? (
                  <EmailAnalytics />
                ) : activeTab === 'notifications' ? (
                  <NotificationManagement theme={darkMode ? 'dark' : 'light'} />
                ) : activeTab === 'performance' ? (
                  <PerformanceDashboard darkMode={darkMode} />
                ) : activeTab === 'security' ? (
                  <SecurityDashboard darkMode={darkMode} />
                ) : (
                  <ContentManagement activeTab={activeTab} darkMode={darkMode} />
                )}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;