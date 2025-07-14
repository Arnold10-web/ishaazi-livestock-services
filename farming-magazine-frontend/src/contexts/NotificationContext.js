import React, { useState, useEffect, useContext, createContext } from 'react';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Temporarily disable all notification features to prevent errors
    // TODO: Implement proper push notification setup with backend support
    
    // Setup basic notification context without external dependencies
    setIsConnected(true);

    // Unregister any existing service workers to prevent old polling logic
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered to prevent notification errors');
          });
        }
      });
    }

    return () => {
      // Cleanup connections
    };
  }, []);

  // Temporarily disabled push notification initialization
  // TODO: Implement proper push notification setup when backend is ready
  // const initializePushNotifications = async () => {
  //   console.log('Push notifications temporarily disabled');
  //   return;
    
    /* Original code - uncomment when implementing push notifications
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(subscription)
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
    */
  // };

  // const initializeRealTimeConnection = () => {
  //   // Temporarily disable notification polling to prevent errors
  //   // TODO: Fix notification endpoints to use correct backend URL
  //   setIsConnected(true);
  //   return () => {}; // Return empty cleanup function
  // };

  const showNotification = (message, type = 'info', options = {}) => {
    const notificationOptions = {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, notificationOptions);
        break;
      case 'error':
        toast.error(message, notificationOptions);
        break;
      case 'warning':
        toast.warning(message, notificationOptions);
        break;
      case 'info':
      default:
        toast.info(message, notificationOptions);
        break;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    isConnected,
    showNotification,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
