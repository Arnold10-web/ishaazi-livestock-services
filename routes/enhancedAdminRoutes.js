/**
 * @file Enhanced Admin Routes
 * @description Routes for the dual-role admin system
 * @module routes/enhancedAdminRoutes
 */

import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import {
    loginAdmin,
    registerAdmin,
    logoutAdmin,
    getAdminDashboard,
    getAdminProfile,
    updateAdminProfile,
    changePassword,
    checkAuth,
    createAdminUser
} from '../controllers/enhancedAdminController.js';

// Import the merged dashboard controller for comprehensive stats and cleanup utilities
import { 
    getDashboardStats,
    getCleanDashboardStats,
    validateViewCounts,
    resetDevelopmentViews
} from '../controllers/mergedDashboardController.js';

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

// Middleware to check if registration is enabled
const checkRegistrationEnabled = async (req, res, next) => {
    try {
        // Check if registration is explicitly disabled via environment variable
        if (process.env.DISABLE_REGISTRATION === 'true') {
            return res.status(403).json({
                success: false,
                message: 'Registration has been disabled by system administrator'
            });
        }

        // Check if any users exist (only allow first user registration)
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'Registration is disabled. System administrator already exists.'
            });
        }

        next();
    } catch (error) {
        console.error('Registration check error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to verify registration status'
        });
    }
};

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
 * @desc Register first system admin (only if no users exist and registration is enabled)
 * @access Public (restricted by checkRegistrationEnabled middleware)
 */
router.post('/register', checkRegistrationEnabled, logActivity('user_created', 'user'), registerAdmin);

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

/**
 * @route GET /api/admin/dashboard/clean
 * @desc Get cleaned dashboard statistics (comment-free, validated)
 * @access Private (Editor+)
 */
router.get('/dashboard/clean', authenticateToken, requireEditor, logActivity('clean_dashboard_accessed', 'dashboard'), getCleanDashboardStats);

/**
 * @route GET /api/admin/dashboard/validate-views
 * @desc Validate and audit view count accuracy
 * @access Private (Editor+)
 */
router.get('/dashboard/validate-views', authenticateToken, requireEditor, logActivity('view_validation', 'dashboard'), validateViewCounts);

/**
 * @route POST /api/admin/dashboard/reset-dev-views
 * @desc Reset development view counts (use with caution)
 * @access Private (System Admin Only)
 */
router.post('/dashboard/reset-dev-views', authenticateToken, requireSystemAdmin, logActivity('dev_views_reset', 'system'), resetDevelopmentViews);

// ========================================
// User Management Routes (System Admin Only)
// ========================================

/**
 * @route POST /api/admin/users/create-editor
 * @desc Create new editor user
 * @access Private (System Admin Only)
 */
router.post('/users/create-editor', 
    requireSystemAdmin, 
    logActivity('editor_created', 'user'), 
    createAdminUser);

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

/**
 * @route POST /api/admin/disable-registration
 * @desc Permanently disable user registration (System Admin only)
 * @access Private (System Admin only)
 */
router.post('/disable-registration', 
    authenticateToken, 
    requireSystemAdmin, 
    logActivity('registration_disabled', 'system'), 
    async (req, res) => {
        try {
            // This endpoint allows manual disabling of registration
            // In a production environment, you might want to store this in a database
            // For now, we'll just inform the admin about the environment variable approach
            
            await ActivityLog.logActivity({
                userId: req.user._id,
                username: req.user.username || req.user.email,
                userRole: req.user.role,
                action: 'registration_disabled',
                resource: 'system',
                details: {
                    note: 'Admin requested to disable registration',
                    method: req.method,
                    path: req.path
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'success',
                severity: 3
            });
            
            res.json({
                success: true,
                message: 'Registration control information',
                info: {
                    currentStatus: process.env.DISABLE_REGISTRATION === 'true' ? 'disabled' : 'enabled',
                    instructions: 'To permanently disable registration, set DISABLE_REGISTRATION=true in your environment variables and restart the server.',
                    automaticDisabling: 'Registration is automatically disabled once any users exist in the system.'
                }
            });
            
        } catch (error) {
            console.error('Error handling registration disable request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process request',
                error: error.message
            });
        }
    }
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
