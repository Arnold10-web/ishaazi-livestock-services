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
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// Ensure environment variables are loaded
dotenv.config({ path: envPath });

/**
 * Configure web-push library with Voluntary Application Server Identification (VAPID) keys
 * VAPID keys provide a way to identify the application server to push services
 * and associate pushes with a specific application
 */

// Load and validate VAPID keys with retries
const getVapidKeys = () => {
    const vapidPublic = process.env.PUSH_NOTIFICATION_VAPID_PUBLIC?.trim();
    const vapidPrivate = process.env.PUSH_NOTIFICATION_VAPID_PRIVATE?.trim();
    const emailContact = process.env.EMAIL_USER?.trim();

    // Debug logging for VAPID configuration
    console.log('\n[PUSH] Push Notification Configuration:');
    console.log('- EMAIL_USER:', emailContact ? '[SET]' : '[NOT SET]');
    console.log('- PUSH_NOTIFICATION_VAPID_PUBLIC:', vapidPublic ? '[SET]' : '[NOT SET]');
    console.log('- PUSH_NOTIFICATION_VAPID_PRIVATE:', vapidPrivate ? '[SET]' : '[NOT SET]');

    return { vapidPublic, vapidPrivate, emailContact };
};

// Get initial VAPID configuration
const { vapidPublic, vapidPrivate, emailContact } = getVapidKeys();

// Enhanced validation
const missingKeys = [];
if (!vapidPublic)   missingKeys.push('PUSH_NOTIFICATION_VAPID_PUBLIC');
if (!vapidPrivate)  missingKeys.push('PUSH_NOTIFICATION_VAPID_PRIVATE');
if (!emailContact)  missingKeys.push('EMAIL_USER');

if (missingKeys.length > 0) {
  const errorMsg = `Missing required VAPID keys: ${missingKeys.join(', ')}.\n` +
    'Please ensure these are set in your .env file and the environment is properly loaded.\n' +
    'You may need to restart your server after updating the .env file.';
  console.error('\x1b[31m%s\x1b[0m', errorMsg); // Red error text
  throw new Error(errorMsg);
}

try {
  webpush.setVapidDetails(
    `mailto:${emailContact}`,
    vapidPublic,
    vapidPrivate
  );
  console.log('\x1b[32m%s\x1b[0m', 'VAPID configuration successful!'); // Green success text
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Failed to configure VAPID:', error.message);
  throw error;
}

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
