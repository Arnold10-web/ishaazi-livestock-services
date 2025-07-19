// routes/pushSubscriptionRoutes.js
import express from 'express';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications, 
  getSubscriptionStatus 
} from '../controllers/pushSubscriptionController.js';
import { subscriptionRateLimiter, unsubscribeRateLimiter, generalRateLimiter } from '../middleware/rateLimiter.js';
import { validateSubscriptionData } from '../middleware/validateSubscriptionData.js';

const router = express.Router();

/**
 * @route   POST /api/push-notifications/subscribe
 * @desc    Subscribe to push notifications
 * @access  Public
 */
router.post('/subscribe', subscriptionRateLimiter, validateSubscriptionData, subscribeToPushNotifications);

/**
 * @route   POST /api/push-notifications/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Public
 */
router.post('/unsubscribe', unsubscribeRateLimiter, unsubscribeFromPushNotifications);

/**
 * @route   GET /api/push-notifications/status
 * @desc    Check subscription status
 * @access  Public
 */
router.get('/status', generalRateLimiter, getSubscriptionStatus);

/**
 * @route   GET /api/push-notifications/vapid-key
 * @desc    Get VAPID public key for subscription
 * @access  Public
 */
router.get('/vapid-key', (req, res) => {
  const vapidPublicKey = process.env.PUSH_NOTIFICATION_VAPID_PUBLIC;
  
  if (!vapidPublicKey) {
    return res.status(500).json({
      success: false,
      message: 'PUSH_NOTIFICATION_VAPID_PUBLIC key not configured in environment'
    });
  }
  
  res.json({
    success: true,
    vapidPublicKey
  });
});

export default router;
