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
    // Initialize push notifications if supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      initializePushNotifications();
    }

    // Setup real-time connection (WebSocket or Server-Sent Events)
    initializeRealTimeConnection();

    return () => {
      // Cleanup connections
    };
  }, []);

  const initializePushNotifications = async () => {
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
  };

  const initializeRealTimeConnection = () => {
    // For now, use polling. In production, consider WebSocket or Server-Sent Events
    const pollForNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/recent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.notifications) {
            setNotifications(prev => {
              const newNotifications = data.notifications.filter(
                notif => !prev.find(p => p._id === notif._id)
              );
              return [...newNotifications, ...prev].slice(0, 50); // Keep last 50
            });
          }
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setIsConnected(false);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollForNotifications, 30000);
    pollForNotifications(); // Initial call

    return () => clearInterval(interval);
  };

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
