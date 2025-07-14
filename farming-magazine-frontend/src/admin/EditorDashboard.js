import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Import responsive utilities
import { useResponsive } from '../utils/responsiveUtils';

const ContentManagement = lazy(() => import('./ContentManagement'));
// Enhanced dashboard component with improved UI and accurate statistics
const EnhancedOverview = lazy(() => import('../components/EnhancedOverview'));

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
    registrations: 'user-plus'
  };
  return icons[tab] || 'cog';
}

const EditorDashboard = () => {
  // Set default tab to overview
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Add dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const [actionToTrigger, setActionToTrigger] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add responsive utilities
  const { isMobile, isMinBreakpoint } = useResponsive();
  const isLargeScreen = isMinBreakpoint('lg');

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

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

  // Handle navigation from quick actions
  useEffect(() => {
    if (location.state?.activeTab && location.state?.from === 'quickAction') {
      setActiveTab(location.state.activeTab);
      setActionToTrigger(location.state.action);
      // Clear the state to prevent issues with browser back/forward
      navigate('/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

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

  // Close sidebar when clicking on a tab (mobile behavior)
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
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
    { id: 'newsletters', label: 'Newsletters' },
    { id: 'subscribers', label: 'Subscribers' },
    { id: 'events', label: 'Events' },
    { id: 'registrations', label: 'Event Registrations' },
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
      {/* Header - Enhanced responsive design */}
      <header className={`${darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'} 
        border-b px-3 sm:px-6 py-3 sm:py-4 shadow-sm flex justify-between items-center transition-colors duration-300`}>
        <div className="flex items-center min-w-0 flex-1">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 mr-2 sm:mr-3 rounded-full ${darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-700'} 
              lg:hidden transition duration-200`}
          >
            <i className={`fas fa-${sidebarCollapsed ? 'bars' : 'times'}`}></i>
          </button>
          <h1 className={`text-lg sm:text-2xl font-bold tracking-tight flex items-center min-w-0 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="fas fa-tractor mr-1 sm:mr-2 text-teal-600 text-sm sm:text-xl"></i>
            <span className="hidden sm:inline truncate">Ishaazi Livestock Services</span>
            <span className="sm:hidden truncate">Ishaazi</span>
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-3 ml-2">
          {/* Notifications */}
          <button className={`relative p-2 rounded-full ${darkMode 
            ? 'hover:bg-gray-700 text-gray-300' 
            : 'hover:bg-gray-100 text-gray-700'} transition duration-200`}>
            <i className="fas fa-bell text-sm sm:text-base"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Dark mode toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode 
              ? 'hover:bg-gray-700 text-yellow-300' 
              : 'hover:bg-gray-100 text-gray-700'} transition duration-200`}
          >
            <i className={`fas fa-${darkMode ? 'sun' : 'moon'} text-sm sm:text-base`}></i>
          </button>
          
          <div className={`hidden md:block ${darkMode 
            ? 'bg-gray-700 text-gray-200' 
            : 'bg-teal-50 text-teal-700'} 
            px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium`}>
            <i className="fas fa-user-edit mr-1"></i>
            <span className="hidden lg:inline">Editor Panel</span>
            <span className="lg:hidden">Editor</span>
          </div>
          <button
            onClick={handleLogout}
            className={`bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 sm:py-2 px-2 sm:px-4 rounded-md shadow transition duration-200 flex items-center text-sm`}
          >
            <i className="fas fa-sign-out-alt mr-1 sm:mr-2"></i> 
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar - Enhanced responsive behavior */}
        <nav className={`${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } fixed lg:relative ${isLargeScreen ? 'lg:w-64' : 'w-64'} h-screen ${darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'} 
        border-r transition-transform duration-300 ease-in-out z-30 flex flex-col`}>
          <div className={`p-3 sm:p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium py-2 px-2 text-sm`}>
              <i className="fas fa-th-large mr-2"></i>
              NAVIGATION
            </div>
          </div>
          
          {/* Scrollable tabs container - Enhanced mobile scrolling */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center w-full py-2.5 sm:py-3 px-2 sm:px-4 rounded-md transition-all duration-200 text-left text-sm sm:text-base ${
                  activeTab === tab.id 
                    ? darkMode 
                      ? 'bg-teal-800 bg-opacity-30 text-teal-400 font-medium' 
                      : 'bg-teal-50 text-teal-700 font-medium' 
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <i className={`fas fa-${getIconForTab(tab.id)} mr-2 sm:mr-3 w-4 sm:w-5 text-center text-sm ${
                  activeTab === tab.id 
                    ? 'text-teal-500' 
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
                <span className="truncate">{tab.label}</span>
                {activeTab === tab.id && (
                  <i className="fas fa-chevron-right ml-auto text-xs text-teal-500"></i>
                )}
              </button>
            ))}
          </div>
          
          {/* Footer stays at bottom - Responsive text sizing */}
          <div className={`p-3 sm:p-4 border-t ${darkMode 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-gray-50'}`}>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs text-center`}>
              <p>© 2025 Ishaazi Livestock Services</p>
              <p>Version 2.0</p>
            </div>
          </div>
        </nav>

        {/* Content Area - Enhanced responsive design */}
        <div className="flex-1 overflow-auto">
          {/* Backdrop for mobile sidebar */}
          {!sidebarCollapsed && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            ></div>
          )}
          
          {/* Tab Content - Responsive padding */}
          <div className={`p-3 sm:p-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {/* Breadcrumb */}
            {getBreadcrumb()}
            
            <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-0">
              <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2 md:mb-0`}>
                <i className={`fas fa-${getIconForTab(activeTab)} mr-2 text-teal-500 text-lg sm:text-xl`}></i>
                <span className="break-words">{tabs.find(tab => tab.id === activeTab)?.label}</span>
              </h2>
              <div className={`${darkMode 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gray-100 text-gray-600'} 
                rounded-lg p-2 sm:p-3 text-xs sm:text-sm flex items-center transition-colors duration-300`}>
                <i className="fas fa-clock mr-1 sm:mr-2"></i> 
                <span className="hidden sm:inline">Last updated: </span>
                <span className="sm:hidden">Updated: </span>
                <span className="break-all">{new Date().toLocaleString()}</span>
              </div>
            </div>

            {/* Content container - Responsive design */}
            <div className={`${darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'} 
              rounded-xl shadow-sm border p-3 sm:p-6 transition-all duration-300 overflow-hidden`}>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-32 sm:h-64">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 border-4 ${darkMode 
                        ? 'border-gray-700' 
                        : 'border-teal-100'} border-dashed rounded-full animate-spin`}></div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                  </div>
                }
              >
                {activeTab === 'overview' ? (
                  <EnhancedOverview darkMode={darkMode} />
                ) : (
                  <>
                    {activeTab === 'subscribers' && <SendPushNotificationButton darkMode={darkMode} />}
                    <ContentManagement 
                      activeTab={activeTab} 
                      darkMode={darkMode} 
                      actionToTrigger={actionToTrigger}
                      onActionHandled={() => setActionToTrigger(null)}
                    />
                  </>
                )}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SendPushNotificationButton() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url })
      });
      const data = await res.json();
      setStatus(data.message || 'Notification sent!');
      setShowForm(false);
      setTitle('');
      setBody('');
      setUrl('');
    } catch (err) {
      setStatus('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
        {showForm ? 'Cancel' : 'Send Push Notification'}
      </button>
      {showForm && (
        <form onSubmit={handleSend} style={{ marginTop: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="block mb-2 p-2 border rounded w-full" />
          <input value={body} onChange={e => setBody(e.target.value)} placeholder="Body" required className="block mb-2 p-2 border rounded w-full" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" className="block mb-2 p-2 border rounded w-full" />
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}
      {status && <div style={{ color: status.includes('fail') ? 'red' : 'green', marginTop: 8 }}>{status}</div>}
    </div>
  );
}

export default EditorDashboard;
