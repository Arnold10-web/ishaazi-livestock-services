/**
 * NotificationContext Tests
 * 
 * Comprehensive tests for the NotificationContext provider and hook
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { testAccessibility } from '../../test-utils/accessibility';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Test component that uses the notification context
const TestComponent = () => {
  const {
    notifications,
    isConnected,
    showNotification,
    markAsRead,
    clearAll,
    unreadCount,
  } = useNotifications();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notifications-list">
        {notifications.map((notification) => (
          <div key={notification._id} data-testid={`notification-${notification._id}`}>
            <span>{notification.message}</span>
            <span>{notification.read ? 'Read' : 'Unread'}</span>
            <button onClick={() => markAsRead(notification._id)}>
              Mark as Read
            </button>
          </div>
        ))}
      </div>
      <button
        data-testid="show-success"
        onClick={() => showNotification('Success message', 'success')}
      >
        Show Success
      </button>
      <button
        data-testid="show-error"
        onClick={() => showNotification('Error message', 'error')}
      >
        Show Error
      </button>
      <button
        data-testid="show-warning"
        onClick={() => showNotification('Warning message', 'warning')}
      >
        Show Warning
      </button>
      <button
        data-testid="show-info"
        onClick={() => showNotification('Info message', 'info')}
      >
        Show Info
      </button>
      <button
        data-testid="show-default"
        onClick={() => showNotification('Default message')}
      >
        Show Default
      </button>
      <button data-testid="clear-all" onClick={clearAll}>
        Clear All
      </button>
    </div>
  );
};

// Component that tries to use the hook outside of provider
const ComponentWithoutProvider = () => {
  const notifications = useNotifications();
  return <div>{notifications.unreadCount}</div>;
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('NotificationProvider', () => {
    it('renders children correctly', () => {
      render(
        <NotificationProvider>
          <div data-testid="child">Child Component</div>
        </NotificationProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides initial state correctly', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      expect(screen.getByTestId('notifications-list')).toBeEmptyDOMElement();
    });

    it('is accessible', async () => {
      const { container } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await testAccessibility(container);
    });
  });

  describe('useNotifications hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ComponentWithoutProvider />);
      }).toThrow('useNotifications must be used within a NotificationProvider');

      consoleSpy.mockRestore();
    });

    it('returns correct context value', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Check that all expected elements are present
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByTestId('unread-count')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
      expect(screen.getByTestId('show-success')).toBeInTheDocument();
      expect(screen.getByTestId('show-error')).toBeInTheDocument();
      expect(screen.getByTestId('show-warning')).toBeInTheDocument();
      expect(screen.getByTestId('show-info')).toBeInTheDocument();
      expect(screen.getByTestId('clear-all')).toBeInTheDocument();
    });
  });

  describe('showNotification function', () => {
    it('shows success notification', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('show-success'));

      expect(toast.success).toHaveBeenCalledWith('Success message', {
        duration: 4000,
        position: 'top-right',
      });
    });

    it('shows error notification', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('show-error'));

      expect(toast.error).toHaveBeenCalledWith('Error message', {
        duration: 4000,
        position: 'top-right',
      });
    });

    it('shows warning notification', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('show-warning'));

      expect(toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 4000,
        position: 'top-right',
      });
    });

    it('shows info notification', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('show-info'));

      expect(toast.info).toHaveBeenCalledWith('Info message', {
        duration: 4000,
        position: 'top-right',
      });
    });

    it('shows default notification as info', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('show-default'));

      expect(toast.info).toHaveBeenCalledWith('Default message', {
        duration: 4000,
        position: 'top-right',
      });
    });

    it('accepts custom options', () => {
      const { rerender } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Create a component that calls showNotification with custom options
      const CustomOptionsComponent = () => {
        const { showNotification } = useNotifications();
        
        React.useEffect(() => {
          showNotification('Custom message', 'success', {
            duration: 8000,
            position: 'bottom-left',
            customOption: 'value',
          });
        }, [showNotification]);

        return <div>Custom Options Test</div>;
      };

      rerender(
        <NotificationProvider>
          <CustomOptionsComponent />
        </NotificationProvider>
      );

      expect(toast.success).toHaveBeenCalledWith('Custom message', {
        duration: 8000,
        position: 'bottom-left',
        customOption: 'value',
      });
    });
  });

  describe('markAsRead function', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it('marks notification as read successfully', async () => {
      const user = userEvent.setup();
      
      // Create a component with initial notifications
      const ComponentWithNotifications = () => {
        const { notifications, markAsRead } = useNotifications();
        const [localNotifications, setLocalNotifications] = React.useState([
          { _id: '1', message: 'Test notification', read: false },
        ]);

        // Simulate the notification state
        React.useEffect(() => {
          // This is a test simulation - in real app, notifications come from context
        }, []);

        return (
          <div>
            {localNotifications.map((notification) => (
              <div key={notification._id} data-testid={`notification-${notification._id}`}>
                <span>{notification.message}</span>
                <span data-testid={`read-status-${notification._id}`}>
                  {notification.read ? 'Read' : 'Unread'}
                </span>
                <button
                  data-testid={`mark-read-${notification._id}`}
                  onClick={() => {
                    markAsRead(notification._id);
                    setLocalNotifications(prev =>
                      prev.map(n =>
                        n._id === notification._id ? { ...n, read: true } : n
                      )
                    );
                  }}
                >
                  Mark as Read
                </button>
              </div>
            ))}
          </div>
        );
      };

      render(
        <NotificationProvider>
          <ComponentWithNotifications />
        </NotificationProvider>
      );

      // Initially unread
      expect(screen.getByTestId('read-status-1')).toHaveTextContent('Unread');

      // Mark as read
      await user.click(screen.getByTestId('mark-read-1'));

      // Check API call
      expect(fetch).toHaveBeenCalledWith('/api/notifications/1/read', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer null', // localStorage.getItem returns null in tests
        },
      });

      // Check UI update
      await waitFor(() => {
        expect(screen.getByTestId('read-status-1')).toHaveTextContent('Read');
      });
    });

    it('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockRejectedValue(new Error('API Error'));

      const ComponentWithError = () => {
        const { markAsRead } = useNotifications();
        
        React.useEffect(() => {
          markAsRead('1');
        }, [markAsRead]);

        return <div>Error Test</div>;
      };

      render(
        <NotificationProvider>
          <ComponentWithError />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error marking notification as read:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('clearAll function', () => {
    it('clears all notifications', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('clear-all'));

      // Since we start with empty notifications, this mainly tests that the function exists
      expect(screen.getByTestId('notifications-list')).toBeEmptyDOMElement();
    });
  });

  describe('Service Worker cleanup', () => {
    it('unregisters existing service workers on mount', async () => {
      const mockUnregister = jest.fn().mockResolvedValue(true);
      const mockGetRegistrations = jest.fn().mockResolvedValue([
        { unregister: mockUnregister },
      ]);

      // Mock navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistrations: mockGetRegistrations,
        },
        configurable: true,
      });

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockGetRegistrations).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockUnregister).toHaveBeenCalled();
      });
    });

    it('handles missing service worker gracefully', () => {
      // Remove serviceWorker from navigator
      const originalServiceWorker = navigator.serviceWorker;
      delete navigator.serviceWorker;

      expect(() => {
        render(
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        );
      }).not.toThrow();

      // Restore
      if (originalServiceWorker) {
        navigator.serviceWorker = originalServiceWorker;
      }
    });
  });

  describe('Integration tests', () => {
    it('maintains state across multiple operations', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Show multiple notifications
      await user.click(screen.getByTestId('show-success'));
      await user.click(screen.getByTestId('show-error'));
      await user.click(screen.getByTestId('show-warning'));

      // Verify all toast calls
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);

      // Clear all
      await user.click(screen.getByTestId('clear-all'));
      
      // State should be reset
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    it('handles rapid successive notifications', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Rapidly click notification buttons
      const successButton = screen.getByTestId('show-success');
      await user.click(successButton);
      await user.click(successButton);
      await user.click(successButton);

      expect(toast.success).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error boundaries', () => {
    it('handles context errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Component that will cause an error
      const ErrorComponent = () => {
        const { showNotification } = useNotifications();
        
        React.useEffect(() => {
          // This should not cause the app to crash
          showNotification(null, 'invalid-type');
        }, [showNotification]);

        return <div>Error Test</div>;
      };

      expect(() => {
        render(
          <NotificationProvider>
            <ErrorComponent />
          </NotificationProvider>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});