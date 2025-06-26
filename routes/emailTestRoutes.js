// routes/emailTestRoutes.js
import express from 'express';
import { 
  testEmailConfig, 
  sendTestEmailEndpoint, 
  testWelcomeEmailEndpoint, 
  emailHealthCheckEndpoint, 
  getEmailConfigStatus 
} from '../controllers/emailTestController.js';
import {
  trackEmailOpen,
  trackEmailClick,
  trackNotificationOpen,
  trackNotificationClick,
  getNewsletterAnalytics,
  getOverallEmailAnalytics
} from '../controllers/emailTrackingController.js';
import { requireRole } from '../middleware/enhancedAuthMiddleware.js';

const router = express.Router();

// Email tracking routes (public - no auth required)
/**
 * @route   GET /api/email/track/open/:newsletterId/:email
 * @desc    Track email opens via tracking pixel
 * @access  Public (tracking pixel)
 */
router.get('/track/open/:newsletterId/:email', trackEmailOpen);

/**
 * @route   POST /api/email/track/click/:newsletterId/:email
 * @desc    Track email clicks
 * @access  Public (tracking from email)
 */
router.post('/track/click/:newsletterId/:email', trackEmailClick);

// Notification tracking routes (public - no auth required)
/**
 * @route   GET /api/email/track/notification/open/:notificationId/:email
 * @desc    Track notification opens via tracking pixel
 * @access  Public (tracking pixel)
 */
router.get('/track/notification/open/:notificationId/:email', trackNotificationOpen);

/**
 * @route   POST /api/email/track/notification/click/:notificationId/:email/:url
 * @desc    Track notification clicks and redirect
 * @access  Public (tracking from email)
 */
router.get('/track/notification/click/:notificationId/:email/:url', trackNotificationClick);

// Email analytics routes (admin only)
router.use(requireRole(['system_admin']));

/**
 * @route   GET /api/email/analytics/newsletter/:newsletterId
 * @desc    Get analytics for a specific newsletter
 * @access  Admin only
 */
router.get('/analytics/newsletter/:newsletterId', getNewsletterAnalytics);

/**
 * @route   GET /api/email/analytics/overall
 * @desc    Get overall email analytics
 * @access  Admin only
 */
router.get('/analytics/overall', getOverallEmailAnalytics);

/**
 * @route   GET /api/email/status
 * @desc    Get email configuration status
 * @access  Admin only
 */
router.get('/status', getEmailConfigStatus);

/**
 * @route   GET /api/email/test/config
 * @desc    Test email configuration
 * @access  Admin only
 */
router.get('/test/config', testEmailConfig);

/**
 * @route   POST /api/email/test/send
 * @desc    Send test email
 * @access  Admin only
 * @body    { email: "test@example.com" }
 */
router.post('/test/send', sendTestEmailEndpoint);

/**
 * @route   POST /api/email/test/welcome
 * @desc    Test welcome email template
 * @access  Admin only
 * @body    { email: "test@example.com", subscriptionType: "all" }
 */
router.post('/test/welcome', testWelcomeEmailEndpoint);

/**
 * @route   POST /api/email/test/health
 * @desc    Comprehensive email system health check
 * @access  Admin only
 * @body    { email: "test@example.com" } (optional)
 */
router.post('/test/health', emailHealthCheckEndpoint);

/**
 * @route   GET /api/email/health
 * @desc    Get email system health statistics
 * @access  Admin only
 */
router.get('/health', async (req, res) => {
  try {
    const { default: emailErrorHandler } = await import('../services/emailErrorHandler.js');
    const healthStats = await emailErrorHandler.getEmailHealthStats();
    
    res.status(200).json({
      success: true,
      data: healthStats
    });
  } catch (error) {
    console.error('Error getting email health stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email health statistics',
      error: error.message
    });
  }
});

export default router;
