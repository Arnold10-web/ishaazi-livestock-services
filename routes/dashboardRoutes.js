import express from 'express';
import { 
    getDashboardStats, 
    resetViewCounts 
} from '../controllers/dashboardController.js';
import { 
    getCleanDashboardStats, 
    validateViewCounts, 
    resetDevelopmentViews 
} from '../controllers/dashboardCleanupController.js';
import { authenticateAdmin } from '../middleware/enhancedAuthMiddleware.js';

const router = express.Router();

// Existing routes
router.get('/stats', authenticateAdmin, getDashboardStats);
router.post('/reset-views', authenticateAdmin, resetViewCounts);

// Enhanced dashboard routes
router.get('/clean-stats', authenticateAdmin, getCleanDashboardStats);
router.post('/validate-views', authenticateAdmin, validateViewCounts);
router.post('/reset-dev-views', authenticateAdmin, resetDevelopmentViews);

export default router;
