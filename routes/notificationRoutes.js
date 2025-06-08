// routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  getNotificationAnalytics,
  triggerNotification,
  deleteNotification,
  resendNotification
} from '../controllers/notificationController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all notifications with pagination and filtering
router.get('/', getNotifications);

// Get notification analytics
router.get('/analytics', getNotificationAnalytics);

// Manually trigger a notification
router.post('/trigger', triggerNotification);

// Resend a failed notification
router.post('/:id/resend', resendNotification);

// Delete a notification
router.delete('/:id', deleteNotification);

export default router;
