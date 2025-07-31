/**
 * @file Enhanced Authentication Middleware
 * @description Enhanced middleware for dual-role admin system with activity logging
 * @module middleware/enhancedAuthMiddleware
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Enhanced authentication middleware with activity logging
 */
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: 'Access denied: No token provided' 
        });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied: Malformed authorization header'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to find user in new User model
        let user = await User.findById(decoded.id);
        
        if (!user) {
            await ActivityLog.logActivity({
                userId: decoded.id,
                username: 'Unknown',
                userRole: 'unknown',
                action: 'login_failed',
                resource: 'authentication',
                details: { errorMessage: 'User not found', method: req.method, path: req.path },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'failure',
                severity: 3
            });
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token - User not found' 
            });
        }

        // Validate editor role requirements
        if ((user.role === 'editor' || user.role === 'admin') && !user.companyEmail) {
            await ActivityLog.logActivity({
                userId: user._id,
                username: getUserIdentifier(user),
                userRole: user.role,
                action: 'login_failed',
                resource: 'authentication',
                details: { 
                    errorMessage: 'Editor account requires company email',
                    method: req.method, 
                    path: req.path 
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'failure',
                severity: 3
            });
            return res.status(403).json({
                success: false,
                message: 'Editor account requires company email'
            });
        }

        // Check if user needs to set up password (skip for password setup routes)
        if (!user.hasSetPassword && !req.path.startsWith('/password/setup')) {
            await ActivityLog.logActivity({
                userId: user._id,
                username: getUserIdentifier(user),
                userRole: user.role,
                action: 'password_setup_required',
                resource: 'authentication',
                details: { method: req.method, path: req.path },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'warning',
                severity: 2
            });
            return res.status(403).json({
                success: false,
                message: 'Password setup required',
                requiresPasswordSetup: true
            });
        }

        // Check if account is active
        if (user.isActive === false) {
            await ActivityLog.logActivity({
                userId: user._id,
                username: user.username || user.companyEmail,
                userRole: user.role,
                action: 'login_failed',
                resource: 'authentication',
                details: { errorMessage: 'Account deactivated', method: req.method, path: req.path },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'failure',
                severity: 4
            });
            
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        req.user = user;
        req.userId = decoded.id;
        req.adminId = decoded.id; // Backward compatibility
        
        next();
    } catch (error) {
        await ActivityLog.logActivity({
            userId: null,
            username: 'Unknown',
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
            severity: 3
        });
        
        return res.status(401).json({ 
            success: false,
            message: 'Invalid or expired token' 
        });
    }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles = []) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied: User not authenticated'
            });
        }

        // Normalize roles for backward compatibility
        const userRole = normalizeRole(req.user.role);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

        if (!normalizedAllowedRoles.includes(userRole)) {
            await ActivityLog.logActivity({
                userId: req.user._id,
                username: getUserIdentifier(req.user),
                userRole: req.user.role,
                action: 'api_access',
                resource: 'authorization',
                details: { 
                    errorMessage: `Access denied: Required roles: ${allowedRoles.join(', ')}, User role: ${req.user.role}`,
                    method: req.method, 
                    path: req.path 
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'failure',
                severity: 3
            });
            
            return res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * System Admin only access
 */
export const requireSystemAdmin = requireRole(['system_admin', 'superadmin']);

/**
 * Editor or higher access
 */
export const requireEditor = requireRole(['system_admin', 'superadmin', 'editor', 'admin']);

/**
 * Any admin access (backward compatibility)
 */
export const requireAdmin = requireRole(['system_admin', 'superadmin', 'editor', 'admin']);

/**
 * Activity logging middleware
 */
export const logActivity = (action, resource) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Store original send function
        const originalSend = res.send;
        
        // Override send function to log after response
        res.send = function(data) {
            const duration = Date.now() - startTime;
            const status = res.statusCode < 400 ? 'success' : 'failure';
            const severity = getSeverityFromStatusCode(res.statusCode);
            
            // Log activity asynchronously
            setImmediate(async () => {
                try {
                    await ActivityLog.logActivity({
                        userId: req.user?._id,
                        username: req.user ? getUserIdentifier(req.user) : 'Anonymous',
                        userRole: req.user?.role || 'unknown',
                        action,
                        resource,
                        resourceId: req.params.id || req.body?._id || req.body?.id,
                        resourceTitle: req.body?.title || req.body?.name,
                        details: {
                            method: req.method,
                            path: req.path,
                            query: sanitizeObject(req.query),
                            body: sanitizeObject(req.body),
                            duration,
                            statusCode: res.statusCode
                        },
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        status,
                        severity
                    });
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
            });
            
            // Call original send
            originalSend.call(this, data);
        };
        
        next();
    };
};

/**
 * Helper function to normalize roles for backward compatibility
 */
function normalizeRole(role) {
    const roleMap = {
        'superadmin': 'system_admin',
        'admin': 'editor'
    };
    
    return roleMap[role] || role;
}

/**
 * Helper function to determine severity from status code
 */
function getSeverityFromStatusCode(statusCode) {
    if (statusCode >= 500) return 5; // Critical
    if (statusCode >= 400) return 4; // High
    if (statusCode >= 300) return 3; // Normal
    return 2; // Low
}

/**
 * Helper function to get consistent user identifier based on role and available fields
 */
function getUserIdentifier(user) {
    if (!user) return 'Unknown';
    
    if (user.role === 'system_admin' || user.role === 'superadmin') {
        return user.username || 'System Admin';
    }
    
    if (user.role === 'editor' || user.role === 'admin') {
        return user.companyEmail || 'Editor (No Company Email)';
    }
    
    return user.companyEmail || user.username || 'Unknown User';
}

/**
 * Helper function to sanitize objects for logging (remove sensitive data)
 */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const sanitized = { ...obj };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

/**
 * Middleware to track login activity
 */
export const trackLogin = async (req, res, next) => {
    if (req.user) {
        try {
            await req.user.recordLogin(
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent'),
                true
            );
            
            await ActivityLog.logActivity({
                userId: req.user._id,
                username: getUserIdentifier(req.user),
                userRole: req.user.role,
                action: 'login',
                resource: 'authentication',
                details: {
                    method: req.method,
                    path: req.path,
                    loginCount: req.user.loginCount + 1
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'success',
                severity: 2
            });
        } catch (error) {
            console.error('Failed to track login:', error);
        }
    }
    next();
};

// Legacy middleware for backward compatibility
export const authorize = (roles = []) => requireRole(roles);
export const authenticateAdmin = async (req, res, next) => {
    await authenticateToken(req, res, () => {
        requireAdmin(req, res, next);
    });
};

// Default export for backward compatibility
const authMiddleware = authenticateToken;
export default authMiddleware;
