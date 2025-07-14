/**
 * System Admin Dashboard Component
 * 
 * Specialized dashboard for System Admin role with advanced system management features.
 * Includes security monitoring, user management, system health, and performance analytics.
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../hooks/useAlert';
import { getAuthHeader } from '../utils/auth';
import API_ENDPOINTS from '../config/apiConfig';

// Add User Modal Component (extracted and memoized to prevent re-rendering issues)
const AddUserModal = memo(({ 
  showAddUserModal, 
  setShowAddUserModal, 
  newUserData, 
  setNewUserData, 
  createUser 
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
      <div className="relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Add New User</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Company Email</label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@yourcompany.com"
                value={newUserData.companyEmail}
                onChange={handleEmailChange}
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Username (Optional)</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
                value={newUserData.username}
                onChange={handleUsernameChange}
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
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
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(true);
  const alert = useAlert();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ companyEmail: '', username: '', role: 'editor' });

  // Create stable callbacks to prevent modal re-renders
  const stableSetNewUserData = useCallback((data) => {
    setNewUserData(data);
  }, []);

  const stableSetShowAddUserModal = useCallback((show) => {
    setShowAddUserModal(show);
  }, []);

  // Dashboard tabs for System Admin
  const tabs = [
    { id: 'security', label: 'Security Monitor', icon: '🛡️' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'logs', label: 'Activity Logs', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  useEffect(() => {
    fetchDashboardData(activeTab);
  }, [activeTab]);

  const fetchDashboardData = async (tab) => {
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
        if (activeTab === 'users') {
          fetchDashboardData('users');
        }
        alert.success('User created successfully! Temporary password sent to company email.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert.error(`Failed to create user: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [newUserData, activeTab, alert, stableSetShowAddUserModal, stableSetNewUserData]);

  // Logout function
  const handleLogout = useCallback(() => {
    try {
      // Clear the admin token
      localStorage.removeItem('myAppAdminToken');
      alert.success('Successfully logged out');
      // Redirect to login or home page
      navigate('/login'); // You may need to adjust this path based on your routing
    } catch (error) {
      console.error('Logout error:', error);
      alert.error('Error during logout');
    }
  }, [alert, navigate]);

  const SecurityDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Security Alerts</h3>
          <p className="text-3xl font-bold text-red-600">
            {dashboardData?.securityAlerts || 0}
          </p>
          <p className="text-sm text-red-700">Active threats detected</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Failed Logins</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {dashboardData?.failedLogins || 0}
          </p>
          <p className="text-sm text-yellow-700">Last 24 hours</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Active Sessions</h3>
          <p className="text-3xl font-bold text-green-600">
            {dashboardData?.activeSessions || 0}
          </p>
          <p className="text-sm text-green-700">Current admin sessions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
        <div className="space-y-3">
          {dashboardData?.recentEvents?.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{event.action}</p>
                <p className="text-sm text-gray-600">{event.timestamp}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                event.severity === 'high' ? 'bg-red-100 text-red-800' :
                event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {event.severity}
              </span>
            </div>
          )) || <p className="text-gray-500">No recent security events</p>}
        </div>
      </div>
    </div>
  );

  const UserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowAddUserModal(true)}
        >
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Total Users</h4>
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData?.totalUsers || 0}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-2">Active Users</h4>
          <p className="text-3xl font-bold text-purple-600">
            {dashboardData?.activeUsers || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData?.users?.map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.username || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'system_admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Disable</button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SystemHealthDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-2">Database Status</h4>
          <p className="text-2xl font-bold text-green-600">
            {dashboardData?.dbStatus || 'Unknown'}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Server Uptime</h4>
          <p className="text-2xl font-bold text-blue-600">
            {dashboardData?.serverMetrics?.uptime ? 
              `${Math.floor(dashboardData.serverMetrics.uptime / 3600)}h` : 'N/A'}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-2">Memory Usage</h4>
          <p className="text-2xl font-bold text-purple-600">
            {dashboardData?.serverMetrics?.memoryUsage?.heapUsed || 'N/A'} MB
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-900 mb-2">Recent Errors</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {dashboardData?.recentErrors?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4">System Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Users:</span>
              <span className="font-semibold">{dashboardData?.systemStats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Users:</span>
              <span className="font-semibold">{dashboardData?.systemStats?.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Logs:</span>
              <span className="font-semibold">{dashboardData?.systemStats?.totalLogs || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Recent Activity (1h):</span>
              <span className="font-semibold">{dashboardData?.systemStats?.recentActivity || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4">Top Error Messages</h4>
          <div className="space-y-2">
            {dashboardData?.topErrors?.slice(0, 5).map((error, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="truncate flex-1 mr-2">{error._id || 'Unknown error'}</span>
                <span className="text-red-600 font-semibold">{error.count}</span>
              </div>
            )) || <p className="text-gray-500">No recent errors</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const PerformanceDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Avg Response Time</h4>
          <p className="text-2xl font-bold text-blue-600">
            {dashboardData?.avgResponseTime || 'N/A'}ms
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-2">Requests/Hour</h4>
          <p className="text-2xl font-bold text-green-600">
            {dashboardData?.requestsPerHour || 0}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-900 mb-2">Error Rate</h4>
          <p className="text-2xl font-bold text-red-600">
            {dashboardData?.errorRate || 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Performance coming soon...</h4>
        <p className="text-gray-500">Detailed performance metrics and charts will be available here.</p>
      </div>
    </div>
  );

  const AnalyticsDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-2">Daily Active Users</h4>
          <p className="text-2xl font-bold text-purple-600">
            {dashboardData?.dailyActiveUsers || 0}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-indigo-900 mb-2">Content Views</h4>
          <p className="text-2xl font-bold text-indigo-600">
            {dashboardData?.contentViews || 0}
          </p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-teal-900 mb-2">User Engagement</h4>
          <p className="text-2xl font-bold text-teal-600">
            {dashboardData?.userEngagement || 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Analytics coming soon...</h4>
        <p className="text-gray-500">Detailed analytics and user behavior insights will be available here.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'security':
        return <SecurityDashboard />;
      case 'users':
        return <UserManagement />;
      case 'performance':
        return <PerformanceDashboard />;
      case 'health':
        return <SystemHealthDashboard />;
      case 'logs':
        return <div className="p-8 text-center text-gray-500">Activity logs dashboard coming soon...</div>;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <SecurityDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
            <div className="flex items-center space-x-4">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                System Admin
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
      
      {/* Add User Modal */}
      <AddUserModal
        showAddUserModal={showAddUserModal}
        setShowAddUserModal={stableSetShowAddUserModal}
        newUserData={newUserData}
        setNewUserData={stableSetNewUserData}
        createUser={createUser}
      />
    </div>
  );
};

export default SystemAdminDashboard;
