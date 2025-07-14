import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const SubscriberList = ({ subscribers, onDelete, darkMode }) => {
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSubscribers(subscribers.map(s => s._id));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSelectSubscriber = (subscriberId) => {
    if (selectedSubscribers.includes(subscriberId)) {
      setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriberId));
    } else {
      setSelectedSubscribers([...selectedSubscribers, subscriberId]);
    }
  };

  const handleBulkAction = async (action, additionalData = {}) => {
    if (selectedSubscribers.length === 0) {
      showNotification('Please select subscribers first', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        API_ENDPOINTS.BULK_UPDATE_SUBSCRIBERS,
        {
          action,
          subscriberIds: selectedSubscribers,
          ...additionalData
        },
        { headers: getAuthHeader() }
      );

      showNotification(response.data.message);
      setSelectedSubscribers([]);
      window.location.reload(); // Refresh the data
    } catch (error) {
      showNotification(error.response?.data?.message || 'Bulk action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionTypeColor = (type) => {
    const colors = {
      'all': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'newsletters': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'events': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'auctions': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'farming-tips': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'livestock-updates': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        } border-l-4`}>
          <div className="flex items-center">
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedSubscribers.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 border-b flex items-center justify-between`}>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {selectedSubscribers.length} subscriber(s) selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <i className="fas fa-check mr-1"></i> Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={loading}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              <i className="fas fa-pause mr-1"></i> Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1"></i> Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedSubscribers.length === subscribers.length && subscribers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Email Address
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Subscription Type
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Status
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Analytics
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Subscribed
              </th>
              <th className={`p-4 text-left text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {subscribers.length > 0 ? (
              subscribers.map((subscriber) => (
                <tr key={subscriber._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber._id)}
                      onChange={() => handleSelectSubscriber(subscriber._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className={`p-4 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="flex items-center">
                      <i className="fas fa-envelope mr-2 text-gray-400"></i>
                      {subscriber.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionTypeColor(subscriber.subscriptionType)}`}>
                      {subscriber.subscriptionType}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      subscriber.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${subscriber.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {subscriber.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={`p-4 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    <div className="text-xs space-y-1">
                      <div>📧 {subscriber.emailsSent || 0} sent</div>
                      <div>👁️ {subscriber.openCount || 0} opens</div>
                      <div>🔗 {subscriber.clickCount || 0} clicks</div>
                    </div>
                  </td>
                  <td className={`p-4 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    {formatDate(subscriber.subscribedAt || subscriber.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onDelete(subscriber._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                        title="Delete subscriber"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleBulkAction(subscriber.isActive ? 'deactivate' : 'activate', { subscriberIds: [subscriber._id] })}
                        className={`${subscriber.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} p-1 rounded`}
                        title={subscriber.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`fas fa-${subscriber.isActive ? 'pause' : 'play'} text-sm`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex flex-col items-center">
                    <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
                    <h3 className="text-lg font-medium mb-2">No subscribers yet</h3>
                    <p className="text-sm">Subscribers will appear here once people start signing up for your newsletter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriberList;
