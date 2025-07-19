/**
 * @file Session Management Utils
 * @description Implements enhanced session tracking and management
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

const SESSION_CONFIG = {
    maxConcurrentSessions: 3,
    sessionDuration: '1d',
    refreshTokenDuration: '7d'
};

/**
 * Manages user sessions with device tracking
 */
export class SessionManager {
    static async createSession(user, deviceInfo) {
        // Clean up expired sessions
        user.sessions = user.sessions || [];
        user.sessions = user.sessions.filter(session => {
            try {
                jwt.verify(session.token, process.env.JWT_SECRET);
                return true;
            } catch (error) {
                return false;
            }
        });

        // Enforce max concurrent sessions
        if (user.sessions.length >= SESSION_CONFIG.maxConcurrentSessions) {
            // Remove oldest session
            user.sessions.shift();
        }

        // Create new session token
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role,
                sessionId: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: SESSION_CONFIG.sessionDuration }
        );

        // Add new session
        user.sessions.push({
            token,
            deviceInfo,
            createdAt: new Date(),
            lastActivity: new Date()
        });

        await user.save();
        return token;
    }

    static async validateSession(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) return null;

            // Check if session exists and is valid
            const session = user.sessions.find(s => s.token === token);
            if (!session) return null;

            // Update last activity
            session.lastActivity = new Date();
            await user.save();

            return {
                user,
                sessionInfo: decoded
            };
        } catch (error) {
            return null;
        }
    }

    static async terminateSession(userId, sessionId) {
        const user = await User.findById(userId);
        if (!user) return false;

        user.sessions = user.sessions.filter(session => {
            try {
                const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
                return decoded.sessionId !== sessionId;
            } catch (error) {
                return false;
            }
        });

        await user.save();
        return true;
    }

    static async terminateAllSessions(userId, exceptSessionId = null) {
        const user = await User.findById(userId);
        if (!user) return false;

        if (exceptSessionId) {
            user.sessions = user.sessions.filter(session => {
                try {
                    const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
                    return decoded.sessionId === exceptSessionId;
                } catch (error) {
                    return false;
                }
            });
        } else {
            user.sessions = [];
        }

        await user.save();
        return true;
    }

    static async listActiveSessions(userId) {
        const user = await User.findById(userId);
        if (!user) return [];

        return user.sessions.map(session => {
            try {
                const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
                return {
                    sessionId: decoded.sessionId,
                    deviceInfo: session.deviceInfo,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity
                };
            } catch (error) {
                return null;
            }
        }).filter(Boolean);
    }
}
