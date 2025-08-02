import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../utils/responsiveUtils';
import PasswordChangeModal from '../components/PasswordChangeModal';

// Lazy load sections
const EnhancedOverview = lazy(() => import('../components/EnhancedOverview'));
const ContentManagement = lazy(() => import('./ContentManagement'));

/**
 * Enhanced Editor Dashboard with Feature-Section Organization
 * Preserves all original functionality while providing better organization
 */
const EditorDashboard = () => {
  // Main navigation state
  const [activeSection, setActiveSection] = useState('overview');
  const [activeContentTab, setActiveContentTab] = useState('blogs');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [actionToTrigger, setActionToTrigger] = useState(null);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken');
    if (!token) navigate('/login');
    
    // Dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [navigate]);

  // Handle navigation from quick actions (preserve original functionality)
  useEffect(() => {
    if (location.state?.activeTab && location.state?.from === 'quickAction') {
      // Map old tab structure to new sections
      const tabToSectionMap = {
        'blogs': { section: 'content', tab: 'blogs' },
        'news': { section: 'content', tab: 'news' },
        'magazines': { section: 'content', tab: 'magazines' },
        'farms': { section: 'content', tab: 'farms' },
        'goats': { section: 'content', tab: 'goats' },
        'dairies': { section: 'content', tab: 'dairies' },
        'beefs': { section: 'content', tab: 'beefs' },
        'piggeries': { section: 'content', tab: 'piggeries' },
        'basics': { section: 'content', tab: 'basics' },
        'auctions': { section: 'content', tab: 'auctions' },
        'subscribers': { section: 'community', tab: 'subscribers' },
        'newsletters': { section: 'community', tab: 'newsletters' },
        'events': { section: 'community', tab: 'events' },
        'registrations': { section: 'community', tab: 'registrations' }
      };
      
      const mapping = tabToSectionMap[location.state.activeTab];
      if (mapping) {
        setActiveSection(mapping.section);
        setActiveContentTab(mapping.tab);
        setActionToTrigger(location.state.action);
      }
      
      // Clear the state to prevent issues with browser back/forward
      navigate('/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

  // Dashboard sections configuration
  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'chart-pie',
      description: 'Dashboard statistics and quick actions'
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: 'edit',
      description: 'Manage all content types',
      subsections: [
        { id: 'blogs', label: 'Blogs', icon: 'file-alt' },
        { id: 'news', label: 'News', icon: 'newspaper' },
        { id: 'magazines', label: 'Magazines', icon: 'book' },
        { id: 'farms', label: 'Farms', icon: 'tractor' },
        { id: 'goats', label: 'Goats', icon: 'paw' },
        { id: 'dairies', label: 'Dairies', icon: 'cheese' },
        { id: 'beefs', label: 'Beef', icon: 'drumstick-bite' },
        { id: 'piggeries', label: 'Piggery', icon: 'piggy-bank' },
        { id: 'basics', label: 'Basics', icon: 'photo-video' },
        { id: 'auctions', label: 'Auctions', icon: 'gavel' }
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: 'users',
      description: 'Manage subscribers and events',
      subsections: [
        { id: 'subscribers', label: 'Subscribers', icon: 'user-plus' },
        { id: 'newsletters', label: 'Newsletters', icon: 'envelope' },
        { id: 'events', label: 'Events', icon: 'calendar-alt' },
        { id: 'registrations', label: 'Event Registrations', icon: 'user-check' }
      ]
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      icon: 'user-cog',
      description: 'Account settings and preferences'
    }
  ];

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

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const handlePasswordChangeSuccess = (message) => {
    // Show success notification
    alert(message); // Replace with proper toast notification
  };

  // Generate breadcrumb
  const getBreadcrumb = () => {
    const currentSection = sections.find(section => section.id === activeSection);
    let breadcrumb = `Dashboard / ${currentSection?.label}`;
    
    if (activeSection === 'content' || activeSection === 'community') {
      const currentContent = currentSection.subsections.find(sub => sub.id === activeContentTab);
      breadcrumb += ` / ${currentContent?.label}`;
    }
    
    return breadcrumb;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} flex transition-colors duration-300`}>
      
      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-16') : 'w-64'} 
        ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
        border-r flex-shrink-0 transform transition-all duration-300 ease-in-out
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
      `}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Editor</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Content Management</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i className={`fas fa-${sidebarCollapsed ? 'chevron-right' : 'chevron-left'} text-gray-600 dark:text-gray-400`}></i>
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-4 space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`
                  w-full flex items-center p-3 rounded-lg text-left transition-colors
                  ${activeSection === section.id 
                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <i className={`fas fa-${section.icon} w-5 text-center`}></i>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <div className="font-medium">{section.label}</div>
                    {section.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {section.description}
                      </div>
                    )}
                  </div>
                )}
              </button>

              {/* Content Management Subsections */}
              {!sidebarCollapsed && activeSection === 'content' && section.id === 'content' && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => setActiveContentTab(subsection.id)}
                      className={`
                        w-full flex items-center p-2 rounded-md text-sm transition-colors
                        ${activeContentTab === subsection.id
                          ? 'bg-teal-50 text-teal-600 dark:bg-teal-800 dark:text-teal-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <i className={`fas fa-${subsection.icon} w-4 text-center mr-2`}></i>
                      {subsection.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Community Subsections */}
              {!sidebarCollapsed && activeSection === 'community' && section.id === 'community' && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => setActiveContentTab(subsection.id)}
                      className={`
                        w-full flex items-center p-2 rounded-md text-sm transition-colors
                        ${activeContentTab === subsection.id
                          ? 'bg-teal-50 text-teal-600 dark:bg-teal-800 dark:text-teal-200'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <i className={`fas fa-${subsection.icon} w-4 text-center mr-2`}></i>
                      {subsection.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Toggle dark mode"
                >
                  <i className={`fas fa-${darkMode ? 'sun' : 'moon'} text-gray-600 dark:text-gray-400`}></i>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-500"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className={`
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
          border-b px-6 py-4 flex justify-between items-center
        `}>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Ishaazi Livestock Services
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getBreadcrumb()}
            </p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className={`relative p-2 rounded-full ${darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-700'} transition duration-200`}>
              <i className="fas fa-bell"></i>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Editor Panel Badge */}
            <div className={`hidden md:block ${darkMode 
              ? 'bg-gray-700 text-gray-200' 
              : 'bg-teal-50 text-teal-700'} 
              px-3 py-1 rounded-full text-sm font-medium`}>
              <i className="fas fa-user-edit mr-1"></i>
              <span className="hidden lg:inline">Editor Panel</span>
              <span className="lg:hidden">Editor</span>
            </div>
            
            {isMobile && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-bars text-gray-600 dark:text-gray-400"></i>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          }>
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <EnhancedOverview darkMode={darkMode} />
            )}

            {/* Content Management Section */}
            {activeSection === 'content' && (
              <ContentManagement 
                activeTab={activeContentTab} 
                darkMode={darkMode} 
                actionToTrigger={actionToTrigger}
                onActionHandled={() => setActionToTrigger(null)}
              />
            )}

            {/* Community Section */}
            {activeSection === 'community' && (
              <div>
                {activeContentTab === 'subscribers' && <SendPushNotificationButton darkMode={darkMode} />}
                <ContentManagement 
                  activeTab={activeContentTab} 
                  darkMode={darkMode} 
                  actionToTrigger={actionToTrigger}
                  onActionHandled={() => setActionToTrigger(null)}
                />
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Profile & Settings
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Password Change Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                        Security
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Change your account password
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Ensure your account stays secure with a strong password
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center"
                        >
                          <i className="fas fa-lock mr-2"></i>
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Theme Settings */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                        Appearance
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Dark mode
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Toggle between light and dark themes
                          </p>
                        </div>
                        <button
                          onClick={toggleDarkMode}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            ${darkMode ? 'bg-teal-600' : 'bg-gray-300'}
                          `}
                        >
                          <span className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${darkMode ? 'translate-x-6' : 'translate-x-1'}
                          `} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Suspense>
        </div>
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

// Send Push Notification Component (preserved from original)
function SendPushNotificationButton({ darkMode }) {
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
    <div className="mb-6">
      <button 
        onClick={() => setShowForm(!showForm)} 
        className={`px-4 py-2 rounded-lg shadow transition-colors ${
          darkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <i className="fas fa-bell mr-2"></i>
        {showForm ? 'Cancel Notification' : 'Send Push Notification'}
      </button>
      
      {showForm && (
        <form onSubmit={handleSend} className={`mt-4 p-4 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="space-y-4">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Notification Title" 
              required 
              className={`w-full p-3 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
            <input 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Notification Body" 
              required 
              className={`w-full p-3 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
            <input 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="URL (optional)" 
              className={`w-full p-3 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      )}
      
      {status && (
        <div className={`mt-3 p-3 rounded-lg ${
          status.includes('fail') || status.includes('Failed') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default EditorDashboard;
