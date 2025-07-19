// controllers/pushSubscriptionController.js
import { subscribeToPush, unsubscribeFromPush } from '../services/pushNotificationService.js';
import logger from '../utils/logger.js';

/**
 * Subscribe to push notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const subscribeToPushNotifications = async (req, res) => {
  try {
    const { subscription, userInfo } = req.body;

    // Validate required fields
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data. Missing endpoint or keys.'
      });
    }

    // Validate subscription keys
    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription keys. Missing p256dh or auth.'
      });
    }

    // Optional user info for better targeting
    const subscriberInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      ...userInfo
    };

    const result = await subscribeToPush(subscription, subscriberInfo);

    if (result.success) {
      logger.info('Push subscription successful', {
        endpoint: subscription.endpoint,
        userInfo: subscriberInfo
      });

      res.status(200).json({
        success: true,
        message: 'Successfully subscribed to push notifications',
        subscriptionId: result.subscriptionId
      });
    } else {
      logger.error('Push subscription failed', {
        error: result.error,
        endpoint: subscription.endpoint
      });

      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to push notifications',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in subscribeToPushNotifications', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while subscribing to push notifications'
    });
  }
};

/**
 * Unsubscribe from push notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const unsubscribeFromPushNotifications = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required for unsubscription'
      });
    }

    const result = await unsubscribeFromPush(endpoint);

    if (result.success) {
      logger.info('Push unsubscription successful', {
        endpoint: endpoint
      });

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } else {
      logger.error('Push unsubscription failed', {
        error: result.error,
        endpoint: endpoint
      });

      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from push notifications',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in unsubscribeFromPushNotifications', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while unsubscribing from push notifications'
    });
  }
};

/**
 * Get subscription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required to check subscription status'
      });
    }

    // Import the Subscriber model to check status
    const { default: Subscriber } = await import('../models/Subscriber.js');
    
    const subscriber = await Subscriber.findOne({ endpoint });
    
    res.status(200).json({
      success: true,
      isSubscribed: !!subscriber,
      subscriptionDate: subscriber?.createdAt || null
    });
  } catch (error) {
    logger.error('Error in getSubscriptionStatus', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error while checking subscription status'
    });
  }
};
