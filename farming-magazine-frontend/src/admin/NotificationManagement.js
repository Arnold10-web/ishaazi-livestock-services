import React, { useState, useEffect, useCallback } from 'react';
import { useAlert } from '../hooks/useAlert';
import { FaBell, FaEnvelope, FaEye, FaMousePointer, FaUsers, FaCalendar, FaNewspaper, FaGlobe, FaSync, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const NotificationManagement = ({ theme }) => {
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const alert = useAlert();

  const fetchNotificationData = useCallback(async () => {
    setLoading(true);
    try {
      const [notificationsRes, analyticsRes] = await Promise.all([
        fetch('/api/notifications/history?period=' + selectedPeriod, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notifications/analytics?period=' + selectedPeriod, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (notificationsRes.ok && analyticsRes.ok) {
        const notificationsData = await notificationsRes.json();
        const analyticsData = await analyticsRes.json();
        
        setNotifications(notificationsData.data.notifications || []);
        setAnalytics(analyticsData.data || {});
      }
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  const resendFailedNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/resend-failed', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchNotificationData(); // Refresh data
        alert.success('Failed notifications have been queued for resending');
      }
    } catch (error) {
      console.error('Error resending notifications:', error);
      alert.error('Failed to resend notifications');
    }
  };

  const sendManualNotification = async (contentType, contentId) => {
    try {
      const response = await fetch('/api/notifications/send-manual', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentType, contentId })
      });

      if (response.ok) {
        fetchNotificationData(); // Refresh data
        alert.success('Manual notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending manual notification:', error);
      alert.error('Failed to send manual notification');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <FaCheck className="text-green-600" />;
      case 'failed': return <FaTimes className="text-red-600" />;
      case 'pending': return <FaSync className="text-yellow-600 animate-spin" />;
      default: return <FaExclamationTriangle className="text-gray-600" />;
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'blog': return <FaNewspaper className="text-blue-600" />;
      case 'news': return <FaGlobe className="text-green-600" />;
      case 'event': return <FaCalendar className="text-purple-600" />;
      default: return <FaBell className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <FaSync className="animate-spin text-4xl text-blue-600" />
          <span className="ml-4 text-xl">Loading notification data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaBell className="mr-3 text-blue-600" />
                Notification Management
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Monitor and manage automated content notifications
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              
              <button
                onClick={resendFailedNotifications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <FaSync className="mr-2" />
                Resend Failed
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
              {['overview', 'notifications', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <FaEnvelope className="text-3xl text-blue-600 mr-4" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Sent
                  </p>
                  <p className="text-2xl font-bold">{analytics.totalSent || 0}</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <FaEye className="text-3xl text-green-600 mr-4" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Open Rate
                  </p>
                  <p className="text-2xl font-bold">{(analytics.openRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <FaMousePointer className="text-3xl text-purple-600 mr-4" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Click Rate
                  </p>
                  <p className="text-2xl font-bold">{(analytics.clickRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <FaTimes className="text-3xl text-red-600 mr-4" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Failed
                  </p>
                  <p className="text-2xl font-bold">{analytics.totalFailed || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className={`rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium">Recent Notifications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {notifications.map((notification) => (
                    <tr key={notification._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getContentTypeIcon(notification.contentType)}
                          <div className="ml-3">
                            <div className="text-sm font-medium">
                              {notification.title}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {notification.contentType.charAt(0).toUpperCase() + notification.contentType.slice(1)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {notification.recipients}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(notification.status)}
                          <span className={`ml-2 text-sm ${getStatusColor(notification.status)}`}>
                            {notification.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(notification.sentAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {notification.status === 'failed' && (
                          <button
                            onClick={() => sendManualNotification(notification.contentType, notification.contentId)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-medium mb-4">Content Type Performance</h3>
              <div className="space-y-4">
                {analytics.byContentType && Object.entries(analytics.byContentType).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getContentTypeIcon(type)}
                      <span className="ml-2 capitalize">{type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stats.sent} sent</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {(stats.openRate || 0).toFixed(1)}% open rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-medium mb-4">Subscription Type Engagement</h3>
              <div className="space-y-4">
                {analytics.bySubscriptionType && Object.entries(analytics.bySubscriptionType).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUsers className="text-blue-600 mr-2" />
                      <span className="capitalize">{type.replace('-', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stats.subscribers} subscribers</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {(stats.engagementRate || 0).toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManagement;
