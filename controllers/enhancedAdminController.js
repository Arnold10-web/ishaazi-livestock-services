/**
 * @file Enhanced Admin Controller
 * @description Enhanced admin controller supporting dual-role authentication system
 * @module controllers/enhancedAdminController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { createPasswordSetupToken, generatePasswordSetupLink } from './passwordSetupController.js';
import { sendEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
            // If not found, user doesn't exist or credentials are invalid
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
                email: user.companyEmail  // Use companyEmail consistently
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
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required for system admin'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        // Check if this is the first user (allow first system admin creation)
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;
        
        if (!isFirstUser) {
            return res.status(403).json({
                success: false,
                message: 'System admin registration is restricted'
            });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        // Create new system admin
        const newAdmin = new User({
            username: username || email.split('@')[0] + '_admin', // Auto-generate username if not provided
            password,
            email: email.toLowerCase(),
            role: 'system_admin',
            isActive: true
        });
        
        await newAdmin.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: newAdmin._id,
            username: newAdmin.email, // Use email as identifier
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

/**
 * Create a new admin user with enhanced validation and security
 */
export const createAdminUser = async (req, res) => {
    try {
        const { email, firstName, lastName, companyName } = req.body;
        
        // Basic validation
        if (!email || !firstName || !lastName) {
            return res.status(400).json({ 
                message: 'Email, first name, and last name are required' 
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address' 
            });
        }

        // Check if user already exists
        let user = await User.findOne({ companyEmail: email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        // Create user with temporary password
        user = new User({
            companyEmail: email,  // Use companyEmail instead of email
            firstName,
            lastName,
            companyName,
            role: 'editor',  // Use 'editor' instead of 'admin'
            password: tempPassword,  // Add required password field
            isTemporaryPassword: true,  // Mark as temporary
            hasSetPassword: true  // User has a password (even if temporary)
        });
        await user.save();

        // Generate password setup token and link
        const setupToken = await createPasswordSetupToken(user._id);
        const passwordSetupLink = generatePasswordSetupLink(setupToken);

        // Read email template
        const templatePath = path.join(process.env.EMAIL_TEMPLATES_PATH || path.join(__dirname, '../templates/email'), 'welcome-admin.html');
        
        let emailTemplate;
        try {
            emailTemplate = await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            console.error('Error reading email template:', error);
            throw new Error('Failed to load email template');
        }

        // Sanitize and validate environment variables
        if (!process.env.SUPPORT_EMAIL) {
            throw new Error('SUPPORT_EMAIL environment variable is not configured');
        }
        if (!process.env.FRONTEND_URL) {
            throw new Error('FRONTEND_URL environment variable is not configured');
        }

        // Replace template variables with sanitized values
        emailTemplate = emailTemplate
            .replace('{{companyName}}', (companyName || '').trim())
            .replace('{{companyEmail}}', email.trim())
            .replace(
                '{{createdBy}}',
                req.user ? `${req.user.firstName.trim()} ${req.user.lastName.trim()}` : 'System Admin'
            )
            .replace('{{passwordSetupLink}}', passwordSetupLink)
            .replace('{{supportEmail}}', process.env.SUPPORT_EMAIL.trim())
            .replace('{{loginUrl}}', `${process.env.FRONTEND_URL.trim()}/login`);

        // Send welcome email
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to Ishaazi Livestock Services Admin Portal',
                html: emailTemplate
            });
            console.log(`[SUCCESS] Welcome email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail user creation if email fails
        }

        console.log('Admin user created successfully', { 
            userId: user._id 
        });

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: user._id,
                companyEmail: user.companyEmail,  // Use companyEmail instead of email
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName
            }
        });
    } catch (error) {
        console.error('Error creating admin user:', error);
        
        // Handle specific error types
        if (error.message === 'Failed to load email template') {
            return res.status(500).json({ 
                message: 'Server configuration error',
                error: 'Email template not found'
            });
        }
        
        if (error.message.includes('environment variable')) {
            return res.status(500).json({ 
                message: 'Server configuration error',
                error: error.message
            });
        }

        // Handle database errors
        if (error.name === 'MongoError' || error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid data provided',
                error: error.message
            });
        }

        // Generic error response
        res.status(500).json({ 
            message: 'Error creating admin user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
export { loginAdmin as login };
export { registerAdmin as register };
export { logoutAdmin as logout };
export { getAdminDashboard as getDashboard };
export { getAdminProfile as getProfile };
export { updateAdminProfile as updateProfile };
