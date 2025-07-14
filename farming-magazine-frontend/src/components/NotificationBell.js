/**
 * NotificationBell Component
 * 
 * Interactive notification system providing users with real-time updates
 * on new content, events, and system notifications. Features include unread
 * count, mark as read functionality, and contextual navigation.
 * 
 * @module components/NotificationBell
 */
import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Bell icon with dropdown notification center
 * 
 * @returns {JSX.Element} Notification bell with dropdown
 */
const NotificationBell = () => {
  // Component state
  const [isOpen, setIsOpen] = useState(false);
  
  // Access notification context
  const { notifications, unreadCount, markAsRead, clearAll, isConnected } = useNotifications();
  
  // Reference for dropdown menu (used for clickaway detection)
  const dropdownRef = useRef(null);

  /**
   * Handle clicking outside the notification dropdown
   * Closes the dropdown when user clicks elsewhere on the page
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Format relative time for notifications
   * Converts timestamp to human-readable format (e.g., "2m ago", "3h ago")
   * 
   * @param {string|Date} date - The notification timestamp
   * @returns {string} Formatted relative time string
   */
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  /**
   * Get appropriate emoji icon for notification type
   * Maps notification types to visual indicators
   * 
   * @param {string} type - Notification type identifier
   * @returns {string} Emoji icon representing the notification type
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'content_published':
        return '📝';
      case 'event_created':
        return '📅';
      case 'newsletter_sent':
        return '📧';
      default:
        return '🔔';
    }
  };

  /**
   * Handle notification click event
   * Marks notification as read and performs any associated navigation
   * 
   * @param {Object} notification - The notification object that was clicked
   */
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to content if applicable
    if (notification.contentType && notification.contentId) {
      window.location.href = `/${notification.contentType}/${notification.contentId}`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <FaBell className="w-6 h-6" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status */}
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  title="Clear all"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <FaBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 ${
                        !notification.read ? 'font-semibold' : ''
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            title="Mark as read"
                          >
                            <FaCheck className="w-3 h-3 mr-1" />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  window.location.href = '/admin/notifications';
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
