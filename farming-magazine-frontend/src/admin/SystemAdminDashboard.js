/**
 * System Admin Dashboard Component - Enhanced with Feature-Section Organization
 * 
 * Specialized dashboard for System Admin role with advanced system management features.
 * Includes security monitoring, user management, system health, and performance analytics.
 * Preserves all original functionality while providing better organization.
 */
import React, { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../hooks/useAlert';
import { getAuthHeader } from '../utils/auth';
import API_ENDPOINTS from '../config/apiConfig';
import { useResponsive } from '../utils/responsiveUtils';
import PasswordChangeModal from '../components/PasswordChangeModal';

// Lazy load components
const DashboardData = lazy(() => import('../components/DashboardData'));
const SecurityDashboard = lazy(() => import('../components/SecurityDashboard'));
const PerformanceDashboard = lazy(() => import('../components/PerformanceDashboard'));
const DataExportTab = lazy(() => import('./components/DataExportTab'));
const BackupManagementTab = lazy(() => import('./components/BackupManagementTab'));
const EmailManagementTab = lazy(() => import('./components/EmailManagementTab'));
const EmailAnalyticsTab = lazy(() => import('./components/EmailAnalyticsTab'));

// Add User Modal Component (preserved from original - memoized to prevent re-rendering issues)
const AddUserModal = memo(({ 
  showAddUserModal, 
  setShowAddUserModal, 
  newUserData, 
  setNewUserData, 
  createUser,
  darkMode 
}) => {
  // Create stable onChange handlers to prevent input focus loss
  const handleEmailChange = useCallback((e) => {
    setNewUserData(prev => ({ ...prev, companyEmail: e.target.value }));
  }, [setNewUserData]);

  const handleUsernameChange = useCallback((e) => {
    setNewUserData(prev => ({ ...prev, username: e.target.value }));
  }, [setNewUserData]);

  const handleRoleChange = useCallback((e) => {
    setNewUserData(prev => ({ ...prev, role: e.target.value }));
  }, [setNewUserData]);

  const handleCancel = useCallback(() => {
    setShowAddUserModal(false);
    setNewUserData({ companyEmail: '', username: '', role: 'editor' });
  }, [setShowAddUserModal, setNewUserData]);

  if (!showAddUserModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md ${
        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'
      }`}>
        <div className="mt-3">
          <h3 className={`text-base sm:text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Add New User</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Company Email</label>
              <input
                type="email"
                className={`mt-1 block w-full border rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="user@yourcompany.com"
                value={newUserData.companyEmail}
                onChange={handleEmailChange}
              />
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Username (Optional)</label>
              <input
                type="text"
                className={`mt-1 block w-full border rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="username"
                value={newUserData.username}
                onChange={handleUsernameChange}
              />
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Role</label>
              <select
                className={`mt-1 block w-full border rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={newUserData.role}
                onChange={handleRoleChange}
              >
                <option value="editor">Editor</option>
                <option value="system_admin">System Admin</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
            <button
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded text-sm hover:bg-gray-400 transition-colors ${
                darkMode 
                  ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                  : 'bg-gray-300 text-gray-700'
              }`}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              onClick={createUser}
              disabled={!newUserData.companyEmail.trim()}
            >
              Create User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const SystemAdminDashboard = () => {
  // Main navigation state
  const [activeSection, setActiveSection] = useState('overview');
  const [activeSubsection, setActiveSubsection] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Dashboard tabs state
  const [activeDashboardTab, setActiveDashboardTab] = useState('security');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Data states (preserved from original)
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newUserData, setNewUserData] = useState({ companyEmail: '', username: '', role: 'editor' });
  
  const navigate = useNavigate();
  const alert = useAlert();
  const { isMobile } = useResponsive();

  // Create stable callbacks to prevent modal re-renders (preserved from original)
  const stableSetNewUserData = useCallback((data) => {
    setNewUserData(data);
  }, []);

  const stableSetShowAddUserModal = useCallback((show) => {
    setShowAddUserModal(show);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('myAppAdminToken');
    if (!token) navigate('/login');
    
    // Auto-collapse sidebar on mobile
    if (isMobile) {
      setSidebarCollapsed(true);
    }
    
    // Dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [navigate, isMobile]);

  // Fetch dashboard data when section changes (preserved from original)
  useEffect(() => {
    if (activeSection === 'overview') {
      fetchDashboardData(activeDashboardTab); // Use active dashboard tab
    } else if (activeSection === 'users') {
      fetchUsers();
    }
  }, [activeSection, activeDashboardTab]);

  // Dashboard data fetching (preserved from original)
  const fetchDashboardData = async (tab = 'security') => {
    try {
      setLoading(true);
      
      // Map frontend tabs to backend endpoints using predefined API_ENDPOINTS
      const endpointMap = {
        'security': API_ENDPOINTS.DASHBOARD_SECURITY,
        'performance': API_ENDPOINTS.DASHBOARD_PERFORMANCE,
        'analytics': API_ENDPOINTS.DASHBOARD_ANALYTICS,
        'health': API_ENDPOINTS.DASHBOARD_SYSTEM_HEALTH,
        'users': API_ENDPOINTS.DASHBOARD_USERS_STATS,
        'logs': API_ENDPOINTS.DASHBOARD_ACTIVITY_LOGS
      };
      
      const endpoint = endpointMap[tab];
      if (!endpoint) {
        setError(`Unknown dashboard tab: ${tab}`);
        setLoading(false);
        return;
      }
      
      console.log(`Fetching data for ${tab} tab from:`, endpoint);
      const response = await axios.get(endpoint, { headers: getAuthHeader() });
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      setError(`Failed to load ${tab} data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // User management functions (preserved from original)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('myAppAdminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        API_ENDPOINTS.CREATE_USER,
        newUserData,
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        stableSetShowAddUserModal(false);
        stableSetNewUserData({ companyEmail: '', username: '', role: 'editor' });
        // Refresh user management data
        fetchUsers();
        alert.success('User created successfully! Temporary password sent to company email.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert.error(`Failed to create user: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [newUserData, alert, stableSetShowAddUserModal, stableSetNewUserData]);

  // Dashboard sections configuration
  const sections = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: 'chart-pie',
      description: 'System health, performance, and statistics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: 'users-cog',
      description: 'Manage users and permissions',
      subsections: [
        { id: 'user-list', label: 'All Users', icon: 'users' },
        { id: 'add-user', label: 'Add User', icon: 'user-plus' },
        { id: 'permissions', label: 'Permissions', icon: 'key' }
      ]
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: 'database',
      description: 'Export, backup, and file management',
      subsections: [
        { id: 'data-export', label: 'Data Export', icon: 'download' },
        { id: 'backup-management', label: 'Backup Management', icon: 'archive' },
        { id: 'file-management', label: 'File Management', icon: 'folder-open' },
        { id: 'auction-management', label: 'Auction Management', icon: 'gavel' }
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: 'envelope-open-text',
      description: 'Email management and notifications',
      subsections: [
        { id: 'email-management', label: 'Email Management', icon: 'envelope' },
        { id: 'email-tracking', label: 'Email Tracking', icon: 'chart-line' },
        { id: 'push-notifications', label: 'Push Notifications', icon: 'bell' }
      ]
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'shield-alt',
      description: 'Security monitoring and logs',
      subsections: [
        { id: 'security-monitor', label: 'Security Monitor', icon: 'eye' },
        { id: 'activity-logs', label: 'Activity Logs', icon: 'list-alt' },
        { id: 'audit-trail', label: 'Audit Trail', icon: 'history' }
      ]
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: 'cogs',
      description: 'Configuration and maintenance',
      subsections: [
        { id: 'system-config', label: 'System Config', icon: 'sliders-h' },
        { id: 'maintenance', label: 'Maintenance', icon: 'wrench' },
        { id: 'health-check', label: 'Health Check', icon: 'heartbeat' }
      ]
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
    setActiveSubsection(''); // Reset subsection
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const handleSubsectionClick = (subsectionId) => {
    setActiveSubsection(subsectionId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const handlePasswordChangeSuccess = (message) => {
    // Show success notification
    alert.success(message);
  };

  // Generate breadcrumb
  const getBreadcrumb = () => {
    const currentSection = sections.find(section => section.id === activeSection);
    let breadcrumb = `Admin Dashboard / ${currentSection?.label}`;
    
    if (activeSubsection) {
      const currentSubsection = currentSection?.subsections?.find(sub => sub.id === activeSubsection);
      breadcrumb += ` / ${currentSubsection?.label}`;
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
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">System Admin</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">System Management</p>
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`
                  w-full flex items-center p-3 rounded-lg text-left transition-colors
                  ${activeSection === section.id 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
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

              {/* Subsections */}
              {!sidebarCollapsed && activeSection === section.id && section.subsections && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => handleSubsectionClick(subsection.id)}
                      className={`
                        w-full flex items-center p-2 rounded-md text-sm transition-colors
                        ${activeSubsection === subsection.id
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-800 dark:text-blue-200'
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

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="mb-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-lock w-5 text-center"></i>
                <span className="ml-3 text-sm">Change Password</span>
              </button>
            </div>
          )}
          
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            {/* System Overview Section */}
            {activeSection === 'overview' && (
              <div className="max-w-6xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    System Overview
                  </h2>
                  
                  {/* Dashboard Tabs Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      {[
                        { id: 'security', label: 'Security', icon: 'shield-alt' },
                        { id: 'performance', label: 'Performance', icon: 'tachometer-alt' },
                        { id: 'analytics', label: 'Analytics', icon: 'chart-line' },
                        { id: 'health', label: 'System Health', icon: 'heartbeat' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveDashboardTab(tab.id)}
                          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeDashboardTab === tab.id
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <i className={`fas fa-${tab.icon} mr-2`}></i>
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Dashboard Content */}
                  {activeDashboardTab === 'security' && (
                    <SecurityDashboard darkMode={darkMode} />
                  )}
                  
                  {activeDashboardTab === 'performance' && (
                    <PerformanceDashboard darkMode={darkMode} />
                  )}
                  
                  {activeDashboardTab === 'analytics' && (
                    dashboardData ? (
                      <DashboardData 
                        data={dashboardData} 
                        loading={loading} 
                        error={error}
                        darkMode={darkMode}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500 dark:text-gray-400">
                          Loading analytics data...
                        </p>
                      </div>
                    )
                  )}
                  
                  {activeDashboardTab === 'health' && (
                    dashboardData ? (
                      <DashboardData 
                        data={dashboardData} 
                        loading={loading} 
                        error={error}
                        darkMode={darkMode}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <i className="fas fa-heartbeat text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500 dark:text-gray-400">
                          Loading system health data...
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* User Management Section */}
            {activeSection === 'users' && (
              <div className="max-w-6xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      User Management
                    </h2>
                    <button
                      onClick={() => stableSetShowAddUserModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add User
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                      {error}
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {users.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white font-medium">
                                        {(user.username || user.email || 'U')[0].toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.username || user.email}
                                    </div>
                                    {user.email && user.username && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`
                                  px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${user.role === 'system-admin' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }
                                `}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                                  Edit
                                </button>
                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Management Section */}
            {activeSection === 'data' && (
              <div className="max-w-6xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Data Management
                  </h2>
                  
                  {/* Data Management Subsection Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      {['data-export', 'backup-management', 'auction-management', 'file-management'].map((subsection) => {
                        const subsectionLabels = {
                          'data-export': 'Data Export',
                          'backup-management': 'Backup Management', 
                          'auction-management': 'Auction Management',
                          'file-management': 'File Management'
                        };
                        const subsectionIcons = {
                          'data-export': 'download',
                          'backup-management': 'archive',
                          'auction-management': 'gavel',
                          'file-management': 'folder-open'
                        };
                        
                        return (
                          <button
                            key={subsection}
                            onClick={() => setActiveSubsection(subsection)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                              activeSubsection === subsection || (!activeSubsection && subsection === 'data-export')
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            <i className={`fas fa-${subsectionIcons[subsection]} mr-2`}></i>
                            {subsectionLabels[subsection]}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Data Management Content */}
                  {(activeSubsection === 'data-export' || !activeSubsection) && (
                    <DataExportTab darkMode={darkMode} />
                  )}
                  
                  {activeSubsection === 'backup-management' && (
                    <BackupManagementTab darkMode={darkMode} />
                  )}
                  
                  {activeSubsection === 'auction-management' && (
                    <div className="text-center py-12">
                      <i className="fas fa-gavel text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-500 dark:text-gray-400">
                        Auction Management analytics will be implemented here
                      </p>
                    </div>
                  )}
                  
                  {activeSubsection === 'file-management' && (
                    <div className="text-center py-12">
                      <i className="fas fa-folder-open text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-500 dark:text-gray-400">
                        File Management features will be implemented here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Communication Section */}
            {activeSection === 'communication' && (
              <div className="max-w-6xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Communication Management
                  </h2>
                  
                  {/* Communication Subsection Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      {['email-management', 'email-tracking', 'push-notifications'].map((subsection) => {
                        const subsectionLabels = {
                          'email-management': 'Email Management',
                          'email-tracking': 'Email Tracking',
                          'push-notifications': 'Push Notifications'
                        };
                        const subsectionIcons = {
                          'email-management': 'envelope',
                          'email-tracking': 'chart-line',
                          'push-notifications': 'bell'
                        };
                        
                        return (
                          <button
                            key={subsection}
                            onClick={() => setActiveSubsection(subsection)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                              activeSubsection === subsection || (!activeSubsection && subsection === 'email-management')
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            <i className={`fas fa-${subsectionIcons[subsection]} mr-2`}></i>
                            {subsectionLabels[subsection]}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Communication Content */}
                  {(activeSubsection === 'email-management' || !activeSubsection) && (
                    <EmailManagementTab darkMode={darkMode} />
                  )}
                  
                  {activeSubsection === 'email-tracking' && (
                    <EmailAnalyticsTab darkMode={darkMode} />
                  )}
                  
                  {activeSubsection === 'push-notifications' && (
                    <div className="text-center py-12">
                      <i className="fas fa-bell text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-500 dark:text-gray-400">
                        Push Notifications management will be implemented here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security and Settings Placeholder sections for future implementation */}
            {['security', 'settings'].includes(activeSection) && (
              <div className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    {sections.find(s => s.id === activeSection)?.label}
                  </h2>
                  <div className="text-center py-12">
                    <i className={`fas fa-${sections.find(s => s.id === activeSection)?.icon} text-4xl text-gray-400 mb-4`}></i>
                    <p className="text-gray-500 dark:text-gray-400">
                      {sections.find(s => s.id === activeSection)?.label} features will be implemented here
                    </p>
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

      {/* Add User Modal */}
      <AddUserModal
        showAddUserModal={showAddUserModal}
        setShowAddUserModal={stableSetShowAddUserModal}
        newUserData={newUserData}
        setNewUserData={stableSetNewUserData}
        createUser={createUser}
        darkMode={darkMode}
      />
    </div>
  );
};

export default SystemAdminDashboard;
