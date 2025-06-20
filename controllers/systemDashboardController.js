/**
 * @file System Admin Dashboard Controllers
 * @description Controllers for system admin dashboard features and analytics
 * @module controllers/systemDashboardController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import mongoose from 'mongoose';

/**
 * Get security dashboard data
 */
export const getSecurityDashboard = async (req, res) => {
    try {
        const { timeframe = 24 } = req.query; // hours
        const startDate = new Date(Date.now() - timeframe * 60 * 60 * 1000);
        
        // Failed login attempts
        const failedLogins = await ActivityLog.find({
            action: 'login_failed',
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 });
        
        // Account lockouts
        const accountLockouts = await ActivityLog.find({
            action: 'account_locked',
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 });
        
        // Failed logins by IP
        const failedLoginsByIP = await ActivityLog.aggregate([
            {
                $match: {
                    action: 'login_failed',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$ipAddress',
                    count: { $sum: 1 },
                    attempts: { $push: { timestamp: '$timestamp', username: '$username' } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Users with multiple failed attempts
        const usersWithFailedAttempts = await User.find({
            failedLoginAttempts: { $gt: 0 }
        }).select('username email companyEmail failedLoginAttempts lockedUntil');
        
        // Recent high-severity events
        const highSeverityEvents = await ActivityLog.find({
            severity: { $gte: 4 },
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 }).limit(20);
        
        // Security metrics
        const securityMetrics = {
            totalFailedLogins: failedLogins.length,
            uniqueIPsWithFailures: failedLoginsByIP.length,
            lockedAccounts: usersWithFailedAttempts.filter(u => u.lockedUntil && u.lockedUntil > Date.now()).length,
            highSeverityEvents: highSeverityEvents.length
        };
        
        res.json({
            success: true,
            data: {
                metrics: securityMetrics,
                failedLogins: failedLogins.slice(0, 50),
                failedLoginsByIP,
                usersWithFailedAttempts,
                highSeverityEvents,
                timeframe: `${timeframe} hours`
            }
        });
        
    } catch (error) {
        console.error('Error fetching security dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch security dashboard data',
            error: error.message
        });
    }
};

/**
 * Get performance dashboard data
 */
export const getPerformanceDashboard = async (req, res) => {
    try {
        const { timeframe = 24 } = req.query; // hours
        const startDate = new Date(Date.now() - timeframe * 60 * 60 * 1000);
        
        // Activity distribution by hour
        const activityByHour = await ActivityLog.aggregate([
            {
                $match: { timestamp: { $gte: startDate } }
            },
            {
                $group: {
                    _id: { $hour: '$timestamp' },
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$details.duration' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Most frequent actions
        const topActions = await ActivityLog.aggregate([
            {
                $match: { timestamp: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$details.duration' },
                    successRate: {
                        $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Error rates by endpoint
        const errorsByEndpoint = await ActivityLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate },
                    status: 'failure'
                }
            },
            {
                $group: {
                    _id: '$details.path',
                    errorCount: { $sum: 1 },
                    errors: { $push: { timestamp: '$timestamp', error: '$details.errorMessage' } }
                }
            },
            { $sort: { errorCount: -1 } },
            { $limit: 10 }
        ]);
        
        // Response time statistics
        const responseTimeStats = await ActivityLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate },
                    'details.duration': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResponseTime: { $avg: '$details.duration' },
                    minResponseTime: { $min: '$details.duration' },
                    maxResponseTime: { $max: '$details.duration' },
                    totalRequests: { $sum: 1 }
                }
            }
        ]);
        
        // System load by user role
        const loadByRole = await ActivityLog.aggregate([
            {
                $match: { timestamp: { $gte: startDate } }
            },
            {
                $group: {
                    _id: '$userRole',
                    requestCount: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $project: {
                    _id: 1,
                    requestCount: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                activityByHour,
                topActions,
                errorsByEndpoint,
                responseTimeStats: responseTimeStats[0] || {},
                loadByRole,
                timeframe: `${timeframe} hours`
            }
        });
        
    } catch (error) {
        console.error('Error fetching performance dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance dashboard data',
            error: error.message
        });
    }
};

/**
 * Get analytics dashboard data
 */
export const getAnalyticsDashboard = async (req, res) => {
    try {
        const { timeframe = 30 } = req.query; // days
        const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        
        // User growth over time
        const userGrowth = await User.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                    },
                    newUsers: { $sum: 1 },
                    byRole: {
                        $push: '$role'
                    }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);
        
        // Login frequency analysis
        const loginFrequency = await ActivityLog.aggregate([
            {
                $match: {
                    action: 'login',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    loginCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    uniqueUsers: { $sum: 1 },
                    totalLogins: { $sum: '$loginCount' },
                    avgLoginsPerUser: { $avg: '$loginCount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Content activity by user
        const contentActivity = await ActivityLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate },
                    action: { $in: ['content_created', 'content_updated', 'content_deleted'] }
                }
            },
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        action: '$action'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.userId',
                    activities: {
                        $push: {
                            action: '$_id.action',
                            count: '$count'
                        }
                    },
                    totalActivity: { $sum: '$count' }
                }
            },
            { $sort: { totalActivity: -1 } },
            { $limit: 10 }
        ]);
        
        // Populate user details for content activity
        const userIds = contentActivity.map(item => item._id).filter(id => id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('username email companyEmail role');
        
        const contentActivityWithUsers = contentActivity.map(item => {
            const user = users.find(u => u._id.toString() === item._id?.toString());
            return {
                ...item,
                user: user ? {
                    username: user.username,
                    email: user.email,
                    companyEmail: user.companyEmail,
                    role: user.role
                } : null
            };
        });
        
        // Peak usage times
        const peakUsage = await ActivityLog.aggregate([
            {
                $match: { timestamp: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$timestamp' },
                        dayOfWeek: { $dayOfWeek: '$timestamp' }
                    },
                    activityCount: { $sum: 1 }
                }
            },
            { $sort: { activityCount: -1 } }
        ]);
        
        // User engagement metrics
        const engagementMetrics = await User.aggregate([
            {
                $project: {
                    role: 1,
                    loginCount: 1,
                    lastLogin: 1,
                    isActive: 1,
                    daysSinceLastLogin: {
                        $divide: [
                            { $subtract: [new Date(), '$lastLogin'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$role',
                    totalUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                    avgLoginCount: { $avg: '$loginCount' },
                    recentlyActive: {
                        $sum: { $cond: [{ $lte: ['$daysSinceLastLogin', 7] }, 1, 0] }
                    }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                userGrowth,
                loginFrequency,
                contentActivity: contentActivityWithUsers,
                peakUsage: peakUsage.slice(0, 20),
                engagementMetrics,
                timeframe: `${timeframe} days`
            }
        });
        
    } catch (error) {
        console.error('Error fetching analytics dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics dashboard data',
            error: error.message
        });
    }
};

/**
 * Get system health dashboard data
 */
export const getSystemHealthDashboard = async (req, res) => {
    try {
        // Database connection status
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Recent error logs
        const recentErrors = await ActivityLog.find({
            status: 'failure',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ timestamp: -1 }).limit(50);
        
        // System statistics
        const systemStats = {
            totalUsers: await User.countDocuments(),
            activeUsers: await User.countDocuments({ isActive: true }),
            totalLogs: await ActivityLog.countDocuments(),
            recentActivity: await ActivityLog.countDocuments({
                timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
            })
        };
        
        // Error rate by hour (last 24 hours)
        const errorRateByHour = await ActivityLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $hour: '$timestamp' },
                    totalRequests: { $sum: 1 },
                    errorCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalRequests: 1,
                    errorCount: 1,
                    errorRate: {
                        $multiply: [
                            { $divide: ['$errorCount', '$totalRequests'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Memory usage (if available)
        const memoryUsage = process.memoryUsage();
        
        // Uptime
        const uptime = process.uptime();
        
        // Database collection sizes
        let collectionStats = [];
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            collectionStats = await Promise.all(
                collections.map(async (collection) => {
                    try {
                        const stats = await mongoose.connection.db.collection(collection.name).stats();
                        return {
                            name: collection.name,
                            count: stats.count || 0,
                            size: stats.size || 0,
                            avgObjSize: stats.avgObjSize || 0
                        };
                    } catch (error) {
                        return {
                            name: collection.name,
                            count: 0,
                            size: 0,
                            avgObjSize: 0
                        };
                    }
                })
            );
        } catch (error) {
            console.error('Error fetching collection stats:', error);
            // Fallback with basic model info
            collectionStats = [
                { name: 'users', count: 0, size: 0, avgObjSize: 0 },
                { name: 'activitylogs', count: 0, size: 0, avgObjSize: 0 },
                { name: 'blogs', count: 0, size: 0, avgObjSize: 0 }
            ];
        }
        
        // Top error messages
        const topErrors = await ActivityLog.aggregate([
            {
                $match: {
                    status: 'failure',
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: '$details.errorMessage',
                    count: { $sum: 1 },
                    lastOccurrence: { $max: '$timestamp' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                dbStatus,
                systemStats,
                errorRateByHour,
                recentErrors: recentErrors.slice(0, 20),
                topErrors,
                serverMetrics: {
                    uptime: Math.floor(uptime),
                    memoryUsage: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024),
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                        external: Math.round(memoryUsage.external / 1024 / 1024)
                    }
                },
                collectionStats
            }
        });
        
    } catch (error) {
        console.error('Error fetching system health dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health data',
            error: error.message
        });
    }
};

/**
 * Get activity logs with filters
 */
export const getActivityLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            userId,
            action,
            resource,
            status,
            severity,
            startDate,
            endDate,
            search
        } = req.query;
        
        // Build query
        const query = {};
        
        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (status) query.status = status;
        if (severity) query.severity = parseInt(severity);
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { resource: { $regex: search, $options: 'i' } },
                { 'details.errorMessage': { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute query
        const [logs, totalLogs] = await Promise.all([
            ActivityLog.find(query)
                .populate('userId', 'username email companyEmail role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ActivityLog.countDocuments(query)
        ]);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalLogs / parseInt(limit));
        
        res.json({
            success: true,
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalLogs,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            error: error.message
        });
    }
};

/**
 * Export activity logs
 */
export const exportActivityLogs = async (req, res) => {
    try {
        const {
            format = 'json',
            startDate,
            endDate,
            userId,
            action,
            resource
        } = req.query;
        
        // Build query
        const query = {};
        
        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (resource) query.resource = resource;
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        const logs = await ActivityLog.find(query)
            .populate('userId', 'username email companyEmail role')
            .sort({ timestamp: -1 })
            .limit(10000); // Limit to prevent memory issues
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'data_export',
            resource: 'activity_log',
            details: {
                format,
                recordCount: logs.length,
                filters: { userId, action, resource, startDate, endDate },
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'csv') {
            // Convert to CSV
            const csvHeader = 'Timestamp,User,Role,Action,Resource,Status,Severity,IP Address,Details\n';
            const csvData = logs.map(log => {
                const user = log.userId ? 
                    (log.userId.username || log.userId.email || log.userId.companyEmail) : 
                    log.username;
                const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
                
                return `"${log.timestamp}","${user}","${log.userRole}","${log.action}","${log.resource}","${log.status}","${log.severity}","${log.ipAddress}","${details}"`;
            }).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.csv"`);
            res.send(csvHeader + csvData);
        } else {
            // Return JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.json"`);
            res.json({
                success: true,
                exportDate: new Date(),
                recordCount: logs.length,
                data: logs
            });
        }
        
    } catch (error) {
        console.error('Error exporting activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export activity logs',
            error: error.message
        });
    }
};
