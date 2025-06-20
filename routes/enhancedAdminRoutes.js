/**
 * @file Enhanced Admin Routes
 * @description Routes for the dual-role admin system
 * @module routes/enhancedAdminRoutes
 */

import express from 'express';
import {
    loginAdmin,
    registerAdmin,
    logoutAdmin,
    getAdminDashboard,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    checkAuth
} from '../controllers/enhancedAdminController.js';

// Import the original dashboard controller for comprehensive stats
import { getDashboardStats } from '../controllers/dashboardController.js';

import {
    createEditor,
    getAllUsers,
    getUserById,
    updateUser,
    resetUserPassword,
    toggleUserStatus,
    deleteUser,
    getUserStats
} from '../controllers/userManagementController.js';

import {
    getSecurityDashboard,
    getPerformanceDashboard,
    getAnalyticsDashboard,
    getSystemHealthDashboard,
    getActivityLogs,
    exportActivityLogs
} from '../controllers/systemDashboardController.js';

import {
    authenticateToken,
    requireSystemAdmin,
    requireEditor,
    logActivity
} from '../middleware/enhancedAuthMiddleware.js';

const router = express.Router();

// ========================================
// Public Routes (No Authentication Required)
// ========================================

/**
 * @route POST /api/admin/login
 * @desc Login with username/email and password
 * @access Public
 */
router.post('/login', logActivity('login', 'authentication'), loginAdmin);

/**
 * @route POST /api/admin/register
 * @desc Register first system admin (only if no users exist)
 * @access Public (restricted)
 */
router.post('/register', logActivity('user_created', 'user'), registerAdmin);

// ========================================
// Protected Routes (Authentication Required)
// ========================================

/**
 * @route POST /api/admin/logout
 * @desc Logout current user
 * @access Private
 */
router.post('/logout', authenticateToken, logActivity('logout', 'authentication'), logoutAdmin);

/**
 * @route GET /api/admin/auth/check
 * @desc Check authentication status
 * @access Private
 */
router.get('/auth/check', authenticateToken, checkAuth);

/**
 * @route GET /api/admin/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, getAdminProfile);

/**
 * @route PUT /api/admin/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', authenticateToken, logActivity('user_updated', 'user'), updateAdminProfile);

/**
 * @route POST /api/admin/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticateToken, logActivity('password_changed', 'user'), changePassword);

/**
 * @route GET /api/admin/dashboard
 * @desc Get comprehensive dashboard statistics and analytics
 * @access Private (Editor+)
 */
router.get('/dashboard', authenticateToken, requireEditor, logActivity('dashboard_accessed', 'dashboard'), getDashboardStats);

// ========================================
// User Management Routes (System Admin Only)
// ========================================

/**
 * @route POST /api/admin/users/create-editor
 * @desc Create new editor user
 * @access Private (System Admin Only)
 */
router.post('/users/create-editor', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('user_created', 'user'), 
    createEditor
);

/**
 * @route POST /api/admin/users
 * @desc Create new user (editor or system admin)
 * @access Private (System Admin Only)
 */
router.post('/users', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('user_created', 'user'), 
    createEditor
);

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination and filters
 * @access Private (System Admin Only)
 */
router.get('/users', 
    authenticateToken, 
    requireSystemAdmin, 
    getAllUsers
);

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics
 * @access Private (System Admin Only)
 */
router.get('/users/stats', 
    authenticateToken, 
    requireSystemAdmin, 
    getUserStats
);

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 * @access Private (System Admin Only)
 */
router.get('/users/:id', 
    authenticateToken, 
    requireSystemAdmin, 
    getUserById
);

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user
 * @access Private (System Admin Only)
 */
router.put('/users/:id', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('user_updated', 'user'), 
    updateUser
);

/**
 * @route POST /api/admin/users/:id/reset-password
 * @desc Reset user password
 * @access Private (System Admin Only)
 */
router.post('/users/:id/reset-password', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('password_reset', 'user'), 
    resetUserPassword
);

/**
 * @route PUT /api/admin/users/:id/toggle-status
 * @desc Toggle user active status
 * @access Private (System Admin Only)
 */
router.put('/users/:id/toggle-status', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('user_updated', 'user'), 
    toggleUserStatus
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user
 * @access Private (System Admin Only)
 */
router.delete('/users/:id', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('user_deleted', 'user'), 
    deleteUser
);

// ========================================
// System Admin Dashboard Routes
// ========================================

/**
 * @route GET /api/admin/dashboard/security
 * @desc Get security dashboard data
 * @access Private (System Admin Only)
 */
router.get('/dashboard/security', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('dashboard_accessed', 'security'), 
    getSecurityDashboard
);

/**
 * @route GET /api/admin/dashboard/performance
 * @desc Get performance dashboard data
 * @access Private (System Admin Only)
 */
router.get('/dashboard/performance', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('dashboard_accessed', 'performance'), 
    getPerformanceDashboard
);

/**
 * @route GET /api/admin/dashboard/analytics
 * @desc Get analytics dashboard data
 * @access Private (System Admin Only)
 */
router.get('/dashboard/analytics', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('dashboard_accessed', 'analytics'), 
    getAnalyticsDashboard
);

/**
 * @route GET /api/admin/dashboard/system-health
 * @desc Get system health dashboard data
 * @access Private (System Admin Only)
 */
router.get('/dashboard/system-health', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('dashboard_accessed', 'system'), 
    getSystemHealthDashboard
);

// ========================================
// Activity Log Routes (System Admin Only)
// ========================================

/**
 * @route GET /api/admin/activity-logs
 * @desc Get activity logs with filters and pagination
 * @access Private (System Admin Only)
 */
router.get('/activity-logs', 
    authenticateToken, 
    requireSystemAdmin, 
    getActivityLogs
);

/**
 * @route GET /api/admin/activity-logs/export
 * @desc Export activity logs
 * @access Private (System Admin Only)
 */
router.get('/activity-logs/export', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('data_export', 'activity_log'), 
    exportActivityLogs
);

// ========================================
// Error Handling Middleware
// ========================================

router.use((error, req, res, next) => {
    console.error('Enhanced Admin Routes Error:', error);
    
    // Log error activity
    if (req.user) {
        import('../models/ActivityLog.js').then(({ default: ActivityLog }) => {
            ActivityLog.logActivity({
                userId: req.user._id,
                username: req.user.username || req.user.email || req.user.companyEmail,
                userRole: req.user.role,
                action: 'api_access',
                resource: 'error',
                details: {
                    errorMessage: error.message,
                    stack: error.stack,
                    method: req.method,
                    path: req.path
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'failure',
                severity: 4
            });
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

export default router;
