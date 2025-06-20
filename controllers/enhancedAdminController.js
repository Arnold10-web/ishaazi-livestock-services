/**
 * @file Enhanced Admin Controller
 * @description Enhanced admin controller supporting dual-role authentication system
 * @module controllers/enhancedAdminController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import jwt from 'jsonwebtoken';

/**
 * Enhanced login supporting both username and email authentication
 */
export const loginAdmin = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Identifier (username/email) and password are required'
            });
        }
        
        let user;
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        try {
            // Try new User model first
            user = await User.findByLoginCredentials(identifier, password);
        } catch (error) {
            // If not found in User model, try Admin model for backward compatibility
            if (error.message === 'Invalid login credentials') {
                try {
                    const admin = await Admin.findOne({ username: identifier });
                    if (admin && await admin.comparePassword(password)) {
                        // Convert Admin to User-like object
                        user = {
                            _id: admin._id,
                            username: admin.username,
                            email: admin.email,
                            role: admin.role === 'superadmin' ? 'system_admin' : 'editor',
                            isActive: true,
                            loginCount: admin.loginCount || 0,
                            lastLogin: admin.lastLogin,
                            isTemporaryPassword: false,
                            recordLogin: async function(ip, ua, success) {
                                admin.lastLogin = new Date();
                                admin.loginCount = (admin.loginCount || 0) + 1;
                                return admin.save();
                            }
                        };
                    }
                } catch (adminError) {
                    console.error('Admin login error:', adminError);
                }
            }
            
            if (!user) {
                await ActivityLog.logActivity({
                    userId: null,
                    username: identifier,
                    userRole: 'unknown',
                    action: 'login_failed',
                    resource: 'authentication',
                    details: { 
                        identifier, 
                        errorMessage: error.message,
                        method: req.method,
                        path: req.path 
                    },
                    ipAddress: clientIP,
                    userAgent,
                    status: 'failure',
                    severity: 3
                });
                
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        }
        
        // Record successful login
        await user.recordLogin(clientIP, userAgent, true);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                username: user.username,
                email: user.loginEmail || user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Log successful login
        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'login',
            resource: 'authentication',
            details: {
                identifier,
                loginCount: user.loginCount + 1,
                method: req.method,
                path: req.path
            },
            ipAddress: clientIP,
            userAgent,
            status: 'success',
            severity: 2
        });
        
        // Prepare response
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            companyEmail: user.companyEmail,
            role: user.role,
            isTemporaryPassword: user.isTemporaryPassword,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount,
            preferences: user.preferences
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse,
            requirePasswordChange: user.isTemporaryPassword
        });
        
    } catch (error) {
        console.error('Login error:', error);
        
        await ActivityLog.logActivity({
            userId: null,
            username: req.body.identifier || 'unknown',
            userRole: 'unknown',
            action: 'login_failed',
            resource: 'authentication',
            details: { 
                errorMessage: error.message,
                method: req.method,
                path: req.path 
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'failure',
            severity: 4
        });
        
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Enhanced registration for system admin accounts
 */
export const registerAdmin = async (req, res) => {
    try {
        const { username, password, email, role = 'system_admin' } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        // Check if this is the first user (allow first system admin creation)
        const userCount = await User.countDocuments();
        const adminCount = await Admin.countDocuments();
        const isFirstUser = userCount === 0 && adminCount === 0;
        
        if (!isFirstUser) {
            return res.status(403).json({
                success: false,
                message: 'System admin registration is restricted'
            });
        }
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        const existingAdmin = await Admin.findOne({ username });
        
        if (existingUser || existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Create new system admin
        const newAdmin = new User({
            username,
            password,
            email: email?.toLowerCase() || undefined, // Email is optional for system_admin
            role: 'system_admin',
            isActive: true
        });
        
        await newAdmin.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: newAdmin._id,
            username: newAdmin.username,
            userRole: newAdmin.role,
            action: 'user_created',
            resource: 'user',
            resourceId: newAdmin._id.toString(),
            resourceTitle: newAdmin.username,
            details: {
                isFirstAdmin: isFirstUser,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        res.status(201).json({
            success: true,
            message: 'System admin registered successfully'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

/**
 * Change password (supports temporary password flow)
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        user.password = newPassword;
        user.isTemporaryPassword = false;
        await user.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'password_changed',
            resource: 'user',
            resourceId: user._id.toString(),
            details: {
                wasTemporary: req.user.isTemporaryPassword,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

/**
 * Get admin profile
 */
export const getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('createdBy', 'username email companyEmail');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

/**
 * Update admin profile
 */
export const updateAdminProfile = async (req, res) => {
    try {
        const { email, preferences } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update allowed fields
        if (email !== undefined && user.role === 'system_admin') {
            // System admins can update their email
            user.email = email.toLowerCase();
        }
        
        if (preferences !== undefined) {
            user.preferences = { ...user.preferences, ...preferences };
        }
        
        await user.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'user_updated',
            resource: 'user',
            resourceId: user._id.toString(),
            details: {
                updatedFields: Object.keys(req.body),
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                companyEmail: user.companyEmail,
                role: user.role,
                preferences: user.preferences,
                updatedAt: user.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

/**
 * Logout admin
 */
export const logoutAdmin = async (req, res) => {
    try {
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email || req.user.companyEmail,
            userRole: req.user.role,
            action: 'logout',
            resource: 'authentication',
            details: {
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 1
        });
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

/**
 * Get dashboard data based on role
 */
export const getAdminDashboard = async (req, res) => {
    try {
        const user = req.user;
        
        // Log dashboard access
        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'dashboard_accessed',
            resource: 'dashboard',
            details: {
                dashboardType: user.role === 'system_admin' ? 'system_admin' : 'editor',
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 1
        });
        
        let dashboardData = {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                companyEmail: user.companyEmail,
                role: user.role,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount
            },
            role: user.role
        };
        
        if (user.role === 'system_admin') {
            // System admin specific data
            const [userStats, recentActivity] = await Promise.all([
                User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                            active: { $sum: { $cond: ['$isActive', 1, 0] } }
                        }
                    }
                ]),
                ActivityLog.find()
                    .sort({ timestamp: -1 })
                    .limit(10)
                    .populate('userId', 'username email companyEmail')
            ]);
            
            dashboardData.systemStats = {
                users: userStats,
                recentActivity
            };
        }
        
        res.json({
            success: true,
            dashboard: dashboardData
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

/**
 * Check authentication status
 */
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            authenticated: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                companyEmail: user.companyEmail,
                role: user.role,
                isTemporaryPassword: user.isTemporaryPassword,
                lastLogin: user.lastLogin,
                preferences: user.preferences
            }
        });
        
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication check failed',
            error: error.message
        });
    }
};

// Legacy functions for backward compatibility
export { loginAdmin as login };
export { registerAdmin as register };
export { logoutAdmin as logout };
export { getAdminDashboard as getDashboard };
export { getAdminProfile as getProfile };
export { updateAdminProfile as updateProfile };
