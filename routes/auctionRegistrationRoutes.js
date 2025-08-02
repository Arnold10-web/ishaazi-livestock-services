// 🛣️ Auction Registration Routes - API endpoints for auction registrations
import express from 'express';
import {
  createRegistration,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  exportRegistrations,
  getAuctionStats,
  getRecentActivity,
  getPerformanceData
} from '../controllers/auctionRegistrationController.js';
import { authenticateToken } from '../middleware/enhancedAuthMiddleware.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (for buyers)
router.post('/auctions/:auctionId/register', 
  generalRateLimiter, // Rate limiting for auction registrations
  createRegistration
);

// Admin routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

// Get all registrations
router.get('/auction-registrations', getAllRegistrations);

// Registration management
router.patch('/auction-registrations/:registrationId/approve', approveRegistration);
router.patch('/auction-registrations/:registrationId/reject', rejectRegistration);

// Export registrations
router.get('/auction-registrations/export', exportRegistrations);

// Statistics and analytics
router.get('/auctions/stats', getAuctionStats);
router.get('/auctions/recent-activity', getRecentActivity);
router.get('/auctions/performance', getPerformanceData);

export default router;
