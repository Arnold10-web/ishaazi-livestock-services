/**
 * @file User Management Controller
 * @description Controller for system admin user management operations
 * @module controllers/userManagementController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendWelcomeEmailToEditor, sendPasswordResetEmail, sendAccountStatusEmail } from '../services/emailService.js';

/**
 * Create a new editor user (System Admin only)
 */
export const createEditor = async (req, res) => {
    try {
        const { companyEmail, username, role = 'editor' } = req.body;
        
        // Validate that only system admins can create users
        if (req.user.role !== 'system_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only system administrators can create users'
            });
        }
        
        // Validate company email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(ishaazilivestockservices\.com|farmingmagazine\.com)$/;
        if (!emailRegex.test(companyEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Must be a valid company email address from ishaazilivestockservices.com'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { companyEmail: companyEmail.toLowerCase() },
                { email: companyEmail.toLowerCase() }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Generate temporary password
        const tempPassword = generateTempPassword();
        
        // Create new user
        const newUser = new User({
            companyEmail: companyEmail.toLowerCase(),
            password: tempPassword,
            role: role === 'system_admin' ? 'editor' : role, // Prevent privilege escalation
            isTemporaryPassword: true,
            createdBy: req.user._id,
            isActive: true
        });
        
        // If username is provided for editor
        if (username && role === 'editor') {
            newUser.username = username;
        }
        
        await newUser.save();
        
        // Send welcome email with temporary password
        try {
            await sendWelcomeEmailToEditor(companyEmail, tempPassword, req.user.username || req.user.email);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue with user creation even if email fails
        }
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'user_created',
            resource: 'user',
            resourceId: newUser._id.toString(),
            resourceTitle: companyEmail,
            details: {
                newUserRole: newUser.role,
                companyEmail: newUser.companyEmail,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        // Return user info without password
        const userResponse = {
            _id: newUser._id,
            companyEmail: newUser.companyEmail,
            username: newUser.username,
            role: newUser.role,
            isActive: newUser.isActive,
            isTemporaryPassword: newUser.isTemporaryPassword,
            createdAt: newUser.createdAt,
            createdBy: req.user.username || req.user.email
        };
        
        res.status(201).json({
            success: true,
            message: 'Editor user created successfully. Temporary password sent to company email.',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error creating editor user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create editor user',
            error: error.message
        });
    }
};

/**
 * Get all users with pagination (System Admin only)
 */
export const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            role,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        // Build query
        const query = {};
        
        if (role) {
            query.role = role;
        }
        
        if (status) {
            query.isActive = status === 'active';
        }
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { companyEmail: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        
        // Execute query
        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .select('-password -passwordHistory -sessions')
                .populate('createdBy', 'username email companyEmail')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Enhance user data with additional status info
        const enhancedUsers = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                status: userObj.isActive ? 'active' : 'inactive',
                statusColor: userObj.isActive ? 'green' : 'red',
                statusText: userObj.isActive ? 'Active' : 'Inactive',
                lastLoginText: userObj.lastLogin ? 
                    new Date(userObj.lastLogin).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Never',
                createdText: new Date(userObj.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
                roleText: userObj.role === 'system_admin' ? 'System Admin' : 'Editor',
                displayName: userObj.fullName || userObj.username || userObj.companyEmail || 'Unknown User'
            };
        });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalUsers / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;
        
        res.json({
            success: true,
            users: enhancedUsers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalUsers,
                hasNextPage,
                hasPrevPage,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

/**
 * Get user by ID (System Admin only)
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id)
            .select('-password')
            .populate('createdBy', 'username email companyEmail');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get recent activity for this user
        const recentActivity = await ActivityLog.find({ userId: id })
            .sort({ timestamp: -1 })
            .limit(10);
        
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                recentActivity
            }
        });
        
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
};

/**
 * Update user (System Admin only)
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, companyEmail, role, isActive, preferences } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Store old values for logging
        const oldValues = {
            username: user.username,
            companyEmail: user.companyEmail,
            role: user.role,
            isActive: user.isActive
        };
        
        // Update fields
        if (username !== undefined) user.username = username;
        if (companyEmail !== undefined) {
            // Validate company email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@(yourcompany\.com|farmingmagazine\.com)$/;
            if (!emailRegex.test(companyEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Must be a valid company email address'
                });
            }
            user.companyEmail = companyEmail.toLowerCase();
        }
        if (role !== undefined && role !== 'system_admin') { // Prevent privilege escalation
            user.role = role;
        }
        if (isActive !== undefined) user.isActive = isActive;
        if (preferences !== undefined) {
            user.preferences = { ...user.preferences, ...preferences };
        }
        
        await user.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'user_updated',
            resource: 'user',
            resourceId: user._id.toString(),
            resourceTitle: user.companyEmail || user.email,
            details: {
                oldValues,
                newValues: {
                    username: user.username,
                    companyEmail: user.companyEmail,
                    role: user.role,
                    isActive: user.isActive
                },
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
            message: 'User updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                companyEmail: user.companyEmail,
                role: user.role,
                isActive: user.isActive,
                preferences: user.preferences,
                updatedAt: user.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
};

/**
 * Reset user password (System Admin only)
 */
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { sendEmail: shouldSendEmail = true } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Generate new temporary password
        const tempPassword = generateTempPassword();
        
        // Reset password
        await user.resetPassword(tempPassword, true);
        
        // Send email if requested and user has company email
        if (shouldSendEmail && user.companyEmail) {
            try {
                await sendPasswordResetEmail(
                    user.companyEmail, 
                    tempPassword, 
                    req.user.username || req.user.email
                );
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
            }
        }
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'password_reset',
            resource: 'user',
            resourceId: user._id.toString(),
            resourceTitle: user.companyEmail || user.email,
            details: {
                targetUser: user.companyEmail || user.email,
                emailSent: shouldSendEmail && user.companyEmail,
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
            message: shouldSendEmail && user.companyEmail 
                ? 'Password reset successfully. New password sent to user\'s company email.'
                : 'Password reset successfully.',
            tempPassword: shouldSendEmail ? undefined : tempPassword // Only return password if not emailing
        });
        
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};

/**
 * Toggle user status (activate/deactivate)
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent deactivating yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }
        
        const oldStatus = user.isActive;
        user.isActive = !user.isActive;
        await user.save();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: user.isActive ? 'user_activated' : 'user_deactivated',
            resource: 'user',
            resourceId: user._id.toString(),
            resourceTitle: user.companyEmail || user.email,
            details: {
                oldStatus,
                newStatus: user.isActive,
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
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                _id: user._id,
                isActive: user.isActive,
                updatedAt: user.updatedAt
            },
            // Add refresh signal for real-time updates
            requiresRefresh: true,
            action: user.isActive ? 'user_activated' : 'user_deactivated'
        });
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user status',
            error: error.message
        });
    }
};

/**
 * Delete user (System Admin only)
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        await User.findByIdAndDelete(id);
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'user_deleted',
            resource: 'user',
            resourceId: id,
            resourceTitle: user.companyEmail || user.email,
            details: {
                deletedUser: {
                    username: user.username,
                    companyEmail: user.companyEmail,
                    role: user.role
                },
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 4
        });
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            deletedUserId: id,
            deletedUser: {
                _id: user._id,
                username: user.username,
                companyEmail: user.companyEmail,
                role: user.role
            },
            timestamp: new Date().toISOString(),
            // Add refresh signal for real-time updates
            requiresRefresh: true,
            action: 'user_deleted'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
                }
            }
        ]);
        
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        res.json({
            success: true,
            stats: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers,
                recentlyCreated: recentUsers,
                byRole: stats
            }
        });
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: error.message
        });
    }
};

// Helper functions

/**
 * Generate temporary password
 */
function generateTempPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(email, tempPassword, createdBy) {
    try {
        // Use the proper welcome template with template data
        await sendEmail({
            to: email,
            subject: 'Welcome to Ishaazi Livestock Services Admin Portal',
            templateName: 'welcome-admin',
            templateData: {
                companyEmail: email,
                createdBy: createdBy,
                companyName: 'Ishaazi Livestock Services',
                // Fix the password setup link to match frontend routing
                passwordSetupLink: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/login?setup=true&email=${encodeURIComponent(email)}`,
                loginUrl: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/login`,
                tempPassword: tempPassword,
                // Add formatted temporary password for display
                temporaryPassword: tempPassword
            }
        });
        
        console.log(`Welcome email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, tempPassword, resetBy) {
    try {
        // Use the proper password reset template
        await sendEmail({
            to: email,
            subject: 'Admin Account Password Reset',
            templateName: 'password-reset-admin',
            templateData: {
                companyEmail: email,
                tempPassword: tempPassword,
                resetBy: resetBy,
                companyName: 'Ishaazi Livestock Services',
                resetDate: new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                loginUrl: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/login`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@ishaazilivestockservices.com'
            }
        });
        
        console.log(`Password reset email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}
