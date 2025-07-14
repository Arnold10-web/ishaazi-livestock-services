/**
 * Notification Component
 * 
 * A simple notification system for displaying messages to users.
 * This is a placeholder implementation that can be extended with context or Redux for state management.
 */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

const Notification = ({ message = null }) => {
  // Local state for notifications
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);

  // If a message is passed as a prop, show it
  useEffect(() => {
    if (message) {
      showNotification(message);
    }
  }, [message]);

  // Show a notification
  const showNotification = (notification) => {
    if (typeof notification === 'string') {
      notification = { message: notification, type: 'info' };
    }
    
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    setVisible(true);
    
    // Auto-hide after timeout
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  // Dismiss a notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setVisible(false);
    }
  };

  // If no notifications, don't render anything
  if (!visible || notifications.length === 0) {
    return null;
  }

  // Helper for icon selection
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`${
            notification.type === 'success' ? 'bg-green-50 border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border-red-200' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          } border px-4 py-3 rounded-lg shadow-md flex items-start max-w-md animate-fade-in`}
        >
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="ml-3 flex-1">
            {notification.title && (
              <h3 className="text-sm font-medium text-gray-800">{notification.title}</h3>
            )}
            <div className="text-sm text-gray-700 mt-0.5">
              {notification.message}
            </div>
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
