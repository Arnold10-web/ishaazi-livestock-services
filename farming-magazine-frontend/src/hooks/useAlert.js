import { useNotifications } from '../contexts/NotificationContext';

/**
 * Custom hook that provides simple alert-like methods using modern toast notifications
 * This replaces the traditional browser alert() calls with better UX
 */
export const useAlert = () => {
  const { showNotification } = useNotifications();

  return {
    // Success messages (green toast)
    success: (message, options = {}) => {
      showNotification(message, 'success', { duration: 3000, ...options });
    },

    // Error messages (red toast)  
    error: (message, options = {}) => {
      showNotification(message, 'error', { duration: 5000, ...options });
    },

    // Warning messages (yellow/orange toast)
    warning: (message, options = {}) => {
      showNotification(message, 'warning', { duration: 4000, ...options });
    },

    // Info messages (blue toast)
    info: (message, options = {}) => {
      showNotification(message, 'info', { duration: 3000, ...options });
    },

    // General purpose alert replacement
    show: (message, type = 'info', options = {}) => {
      showNotification(message, type, options);
    }
  };
};

// Legacy alert replacement - can be used as a drop-in replacement for alert()
export const modernAlert = (message, type = 'info') => {
  // This function can be used to replace alert() calls directly
  // But it's better to use the useAlert hook in React components
  if (typeof window !== 'undefined' && window.toast) {
    switch (type) {
      case 'success':
        window.toast.success(message);
        break;
      case 'error':
        window.toast.error(message);
        break;
      case 'warning':
        window.toast.warning(message);
        break;
      default:
        window.toast.info(message);
    }
  } else {
    // Fallback to regular alert if toast is not available
    alert(message);
  }
};
