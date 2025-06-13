/**
 * Notification WebSocket Service
 * 
 * This service manages real-time notifications via WebSockets. It handles
 * authenticated WebSocket connections, manages client sessions, and delivers
 * real-time notifications to users.
 * 
 * The service includes:
 * - JWT-based authentication for secure WebSocket connections
 * - Per-user connection tracking
 * - Role-based notification filtering
 * - Broadcast and targeted notification delivery
 * - Connection state management
 * - Error handling and reconnection support
 * 
 * @module services/notificationWebSocketService
 */
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';

/**
 * Service for managing WebSocket-based real-time notifications
 * @extends EventEmitter
 */
class NotificationWebSocketService extends EventEmitter {
  /**
   * Creates a new NotificationWebSocketService instance
   * Initializes client tracking and connection management
   */
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.connectionCount = 0;
  }

  /**
   * Initializes the WebSocket server with the HTTP/HTTPS server instance
   * Sets up event handlers for connections and errors
   * 
   * @param {http.Server|https.Server} server - The HTTP/HTTPS server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleError.bind(this));

    console.log('WebSocket notification service initialized');
  }

  /**
   * Verifies client authentication via JWT token
   * Validates the provided token and attaches user information to the request
   * 
   * @param {Object} info - Connection information
   * @param {http.IncomingMessage} info.req - The HTTP request
   * @returns {boolean} Whether the client is authenticated
   */
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token', error.message);
      return false;
    }
  }

  /**
   * Handles a new WebSocket connection
   * Sets up the connection for the user, registers message handlers,
   * and tracks the connection for future notifications
   * 
   * @param {WebSocket} ws - The WebSocket connection
   * @param {http.IncomingMessage} request - The HTTP request with authenticated user
   */
  handleConnection(ws, request) {
    const userId = request.user.userId;
    const userRole = request.user.role;
    
    // Store the connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);
    this.connectionCount++;

    // Add user info to the WebSocket
    ws.userId = userId;
    ws.userRole = userRole;
    ws.isAlive = true;

    console.log(`WebSocket connected: User ${userId} (${userRole}), Total connections: ${this.connectionCount}`);

    // Send initial connection confirmation
    this.sendToClient(ws, {
      type: 'connection_confirmed',
      message: 'Real-time notifications connected',
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle connection error
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });

    // Heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Emit connection event
    this.emit('userConnected', { userId, userRole, connectionCount: this.connectionCount });
  }

  handleClientMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      
      case 'mark_read':
        this.emit('markNotificationRead', {
          userId: ws.userId,
          notificationId: message.notificationId
        });
        break;
      
      case 'mark_all_read':
        this.emit('markAllNotificationsRead', {
          userId: ws.userId
        });
        break;
      
      case 'subscribe_admin':
        if (ws.userRole === 'admin') {
          ws.isAdminSubscribed = true;
          this.sendToClient(ws, {
            type: 'admin_subscription_confirmed',
            message: 'Subscribed to admin notifications'
          });
        }
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleDisconnection(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }
    this.connectionCount--;
    
    console.log(`WebSocket disconnected: User ${ws.userId}, Total connections: ${this.connectionCount}`);
    
    this.emit('userDisconnected', { 
      userId: ws.userId, 
      connectionCount: this.connectionCount 
    });
  }

  handleError(error) {
    console.error('WebSocket Server Error:', error);
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    if (this.clients.has(userId)) {
      const userConnections = this.clients.get(userId);
      const message = JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
      });

      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      return userConnections.size;
    }
    return 0;
  }

  // Send notification to all admin users
  sendToAdmins(notification) {
    let sentCount = 0;
    this.clients.forEach((connections, userId) => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN && 
            ws.userRole === 'admin' && 
            ws.isAdminSubscribed) {
          this.sendToClient(ws, {
            type: 'admin_notification',
            ...notification
          });
          sentCount++;
        }
      });
    });
    return sentCount;
  }

  // Broadcast to all connected users
  broadcast(notification, excludeUserId = null) {
    let sentCount = 0;
    this.clients.forEach((connections, userId) => {
      if (userId !== excludeUserId) {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            this.sendToClient(ws, {
              type: 'broadcast',
              ...notification
            });
            sentCount++;
          }
        });
      }
    });
    return sentCount;
  }

  // Send message to specific WebSocket connection
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // Get connection statistics
  getStats() {
    const userCount = this.clients.size;
    const adminCount = Array.from(this.clients.values())
      .flat()
      .filter(ws => ws.userRole === 'admin').length;
    
    return {
      totalConnections: this.connectionCount,
      uniqueUsers: userCount,
      adminConnections: adminCount,
      uptime: process.uptime()
    };
  }

  // Start heartbeat to detect broken connections
  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((connections) => {
        connections.forEach(ws => {
          if (!ws.isAlive) {
            console.log('Terminating dead connection');
            ws.terminate();
            return;
          }
          ws.isAlive = false;
          ws.ping();
        });
      });
    }, 30000); // 30 seconds
  }

  // Clean shutdown
  shutdown() {
    if (this.wss) {
      console.log('Shutting down WebSocket service...');
      this.wss.clients.forEach(ws => {
        ws.close(1000, 'Server shutting down');
      });
      this.wss.close();
    }
  }
}

// Notification types and templates
const NotificationTypes = {
  USER_REGISTERED: 'user_registered',
  ARTICLE_PUBLISHED: 'article_published',
  COMMENT_ADDED: 'comment_added',
  NEWSLETTER_SENT: 'newsletter_sent',
  SYSTEM_UPDATE: 'system_update',
  ADMIN_ALERT: 'admin_alert'
};

const createNotification = (type, data) => {
  const templates = {
    [NotificationTypes.USER_REGISTERED]: {
      title: 'New User Registration',
      message: `New user ${data.username} has registered`,
      category: 'user',
      priority: 'medium'
    },
    [NotificationTypes.ARTICLE_PUBLISHED]: {
      title: 'New Article Published',
      message: `Article "${data.title}" by ${data.author} has been published`,
      category: 'article',
      priority: 'high'
    },
    [NotificationTypes.COMMENT_ADDED]: {
      title: 'New Comment',
      message: `New comment on "${data.articleTitle}"`,
      category: 'interaction',
      priority: 'low'
    },
    [NotificationTypes.NEWSLETTER_SENT]: {
      title: 'Newsletter Sent',
      message: `Newsletter "${data.subject}" sent to ${data.recipientCount} subscribers`,
      category: 'newsletter',
      priority: 'medium'
    },
    [NotificationTypes.SYSTEM_UPDATE]: {
      title: 'System Update',
      message: data.message,
      category: 'system',
      priority: 'high'
    },
    [NotificationTypes.ADMIN_ALERT]: {
      title: 'Admin Alert',
      message: data.message,
      category: 'alert',
      priority: 'critical'
    }
  };

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...templates[type],
    data,
    timestamp: new Date().toISOString(),
    isRead: false
  };
};

export {
  NotificationWebSocketService,
  NotificationTypes,
  createNotification
};
