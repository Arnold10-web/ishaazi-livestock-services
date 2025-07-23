/**
 * @file Login Security Utils
 * @description Implements login attempt tracking and account security measures
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

const LOGIN_SECURITY = {
    maxAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    attemptWindow: 15 * 60 * 1000    // 15 minutes
};

/**
 * Track failed login attempts and implement account locking
 */
export async function trackLoginAttempt(user, success, ip, userAgent) {
    if (!user) return;

    const now = new Date();
    const attempts = user.loginAttempts || [];

    // Clean up old attempts outside the window
    const recentAttempts = attempts.filter(attempt => 
        (now - new Date(attempt.timestamp)) <= LOGIN_SECURITY.attemptWindow
    );

    // Add new attempt
    recentAttempts.push({
        timestamp: now,
        success,
        ip,
        userAgent
    });

    // Check if account should be locked
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    if (failedAttempts.length >= LOGIN_SECURITY.maxAttempts) {
        user.lockedUntil = new Date(now.getTime() + LOGIN_SECURITY.lockoutDuration);
        user.accountLocked = true;

        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'account_locked',
            resource: 'authentication',
            details: {
                reason: 'Too many failed login attempts',
                failedAttempts: failedAttempts.length,
                lockoutDuration: LOGIN_SECURITY.lockoutDuration / 60000 + ' minutes'
            },
            ipAddress: ip,
            userAgent: userAgent,
            status: 'warning',
            severity: 4
        });
    }

    // Update user
    user.loginAttempts = recentAttempts;
    await user.save();

    return user.accountLocked;
}

/**
 * Check if account is locked and handle unlock timing
 */
export async function checkAccountLock(user) {
    if (!user || !user.accountLocked) return false;

    const now = new Date();
    if (user.lockedUntil && now >= user.lockedUntil) {
        // Auto unlock if lockout period has passed
        user.accountLocked = false;
        user.lockedUntil = null;
        user.loginAttempts = [];
        await user.save();
        return false;
    }

    return {
        locked: true,
        remainingTime: user.lockedUntil ? Math.ceil((user.lockedUntil - now) / 60000) : 0
    };
}

/**
 * Handles suspicious login activity detection
 */
export async function detectSuspiciousActivity(user, ip, userAgent) {
    const suspiciousFactors = [];
    
    // Check for login from new IP
    const isKnownIP = user.knownIPs && user.knownIPs.includes(ip);
    if (!isKnownIP) {
        suspiciousFactors.push('New IP address detected');
    }

    // Check for rapid location changes
    const lastLogin = user.lastLoginAt;
    if (lastLogin) {
        const timeSinceLastLogin = Date.now() - lastLogin;
        if (timeSinceLastLogin < 3600000) { // 1 hour
            // You could implement geolocation checking here
            // if (previousLocation is far from current) {
            //     suspiciousFactors.push('Rapid location change');
            // }
        }
    }

    // Check for unusual login times
    const hour = new Date().getHours();
    if (hour >= 0 && hour <= 5) { // Between midnight and 5 AM
        suspiciousFactors.push('Unusual login time');
    }

    if (suspiciousFactors.length > 0) {
        await ActivityLog.logActivity({
            userId: user._id,
            username: user.username || user.email || user.companyEmail,
            userRole: user.role,
            action: 'suspicious_login',
            resource: 'authentication',
            details: {
                factors: suspiciousFactors,
                ip: ip,
                userAgent: userAgent
            },
            ipAddress: ip,
            userAgent: userAgent,
            status: 'warning',
            severity: 3
        });
    }

    return suspiciousFactors;
}
