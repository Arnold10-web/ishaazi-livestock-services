/**
 * Push Notification Service
 * 
 * This service manages web push notifications for the farming magazine platform.
 * It handles subscribing users to push notifications, sending targeted notifications
 * to individual users, and broadcasting notifications to groups of subscribers.
 * 
 * The service uses the Web Push API with VAPID authentication to securely deliver
 * notifications to supported browsers, even when the website is not open.
 * 
 * @module services/pushNotificationService
 */
import webpush from 'web-push';
import Subscriber from '../models/Subscriber.js';

/**
 * Configure web-push library with Voluntary Application Server Identification (VAPID) keys
 * VAPID keys provide a way to identify the application server to push services
 * and associate pushes with a specific application
 */
webpush.setVapidDetails(
  'mailto:' + (process.env.EMAIL_USER || 'your-email@example.com'),
  process.env.PUSH_NOTIFICATION_VAPID_PUBLIC || '',
  process.env.PUSH_NOTIFICATION_VAPID_PRIVATE || ''
);

/**
 * Send a push notification to a single subscriber
 * 
 * Retrieves the subscriber's push subscription details and delivers
 * a web push notification with the provided payload.
 * 
 * @param {string} subscriberId - The MongoDB ID of the subscriber
 * @param {Object} payload - The notification payload
 * @param {string} payload.title - The notification title
 * @param {string} payload.body - The notification message body
 * @param {string} [payload.url] - URL to open when notification is clicked
 * @param {Object} [payload.data] - Additional data to include with the notification
 * @returns {Promise<Object>} Result indicating success or failure
 */
export const sendPushNotification = async (subscriberId, payload) => {
  try {
    const subscriber = await Subscriber.findById(subscriberId);
    if (!subscriber || !subscriber.pushSubscription) {
      return { success: false, error: 'No push subscription found' };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/logo192.png',
      badge: '/favicon.ico',
      url: payload.url || '/',
      data: payload.data || {}
    });

    await webpush.sendNotification(
      subscriber.pushSubscription,
      notificationPayload
    );

    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to multiple subscribers
 * 
 * Sends the same notification to multiple subscribers in sequence,
 * tracking success and failure counts. This method handles errors for
 * individual subscribers without stopping the entire batch process.
 * 
 * @param {string[]} subscriberIds - Array of subscriber MongoDB IDs
 * @param {Object} payload - The notification payload
 * @param {string} payload.title - The notification title
 * @param {string} payload.body - The notification message body
 * @param {string} [payload.url] - URL to open when notification is clicked
 * @param {Object} [payload.data] - Additional data to include with the notification
 * @returns {Promise<Object>} Results with counts of sent and failed notifications
 */
export const sendBulkPushNotification = async (subscriberIds, payload) => {
  const results = { sent: 0, failed: 0, errors: [] };

  for (const subscriberId of subscriberIds) {
    const result = await sendPushNotification(subscriberId, payload);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        subscriberId,
        error: result.error
      });
    }
  }

  return results;
};

// Subscribe user to push notifications
export const subscribeToPush = async (subscriberId, subscription) => {
  try {
    await Subscriber.findByIdAndUpdate(subscriberId, {
      pushSubscription: subscription,
      pushEnabled: true
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Unsubscribe user from push notifications
export const unsubscribeFromPush = async (subscriberId) => {
  try {
    await Subscriber.findByIdAndUpdate(subscriberId, {
      pushSubscription: null,
      pushEnabled: false
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendPushNotification,
  sendBulkPushNotification,
  subscribeToPush,
  unsubscribeFromPush
};
