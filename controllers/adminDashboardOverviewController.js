/**
 * @file Admin Dashboard Overview Controller
 * @description Comprehensive dashboard data and statistics for system admin
 * @module controllers/adminDashboardOverviewController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

/**
 * Get comprehensive dashboard overview
 */
export const getDashboardOverview = async (req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Run all statistics queries in parallel for better performance
        const [
            userStats,
            contentStats,
            activityStats,
            engagementStats,
            systemStats,
            recentActivities,
            topContent
        ] = await Promise.all([
            getUserStatistics(last24h, last7d, last30d),
            getContentStatistics(last24h, last7d, last30d),
            getActivityStatistics(last24h, last7d, last30d),
            getEngagementStatistics(),
            getSystemStatistics(),
            getRecentActivities(),
            getTopContent()
        ]);

        const overview = {
            users: userStats,
            content: contentStats,
            activity: activityStats,
            engagement: engagementStats,
            system: systemStats,
            recentActivities,
            topContent,
            timestamp: now
        };

        // Log dashboard access
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'dashboard_overview_accessed',
            resource: 'dashboard',
            details: {
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 1
        });

        res.json({
            success: true,
            data: overview
        });

    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard overview',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 */
async function getUserStatistics(last24h, last7d, last30d) {
    const [
        totalUsers,
        activeUsers,
        newUsers24h,
        newUsers7d,
        newUsers30d,
        usersByRole,
        loginStats
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: last24h } }),
        User.countDocuments({ createdAt: { $gte: last7d } }),
        User.countDocuments({ createdAt: { $gte: last30d } }),
        User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        User.aggregate([
            {
                $group: {
                    _id: null,
                    averageLoginCount: { $avg: '$loginCount' },
                    totalLogins: { $sum: '$loginCount' }
                }
            }
        ])
    ]);

    return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        new: {
            last24h: newUsers24h,
            last7d: newUsers7d,
            last30d: newUsers30d
        },
        byRole: usersByRole.reduce((acc, role) => {
            acc[role._id] = role.count;
            return acc;
        }, {}),
        loginStats: loginStats[0] || { averageLoginCount: 0, totalLogins: 0 }
    };
}

/**
 * Get content statistics
 */
async function getContentStatistics(last24h, last7d, last30d) {
    const [
        blogStats,
        newsStats,
        eventStats,
        newsletterStats,
        subscriberStats
    ] = await Promise.all([
        getModelStats(Blog, last24h, last7d, last30d),
        getModelStats(News, last24h, last7d, last30d),
        getModelStats(Event, last24h, last7d, last30d),
        getModelStats(Newsletter, last24h, last7d, last30d),
        getModelStats(Subscriber, last24h, last7d, last30d)
    ]);

    // Get published vs draft content
    const [publishedBlogs, draftBlogs] = await Promise.all([
        Blog.countDocuments({ published: true }),
        Blog.countDocuments({ published: false })
    ]);

    const [publishedNews, draftNews] = await Promise.all([
        News.countDocuments({ published: true }),
        News.countDocuments({ published: false })
    ]);

    return {
        blogs: {
            ...blogStats,
            published: publishedBlogs,
            drafts: draftBlogs
        },
        news: {
            ...newsStats,
            published: publishedNews,
            drafts: draftNews
        },
        events: eventStats,
        newsletters: newsletterStats,
        subscribers: {
            ...subscriberStats,
            active: await Subscriber.countDocuments({ isActive: true }),
            inactive: await Subscriber.countDocuments({ isActive: false })
        }
    };
}

/**
 * Get activity statistics
 */
async function getActivityStatistics(last24h, last7d, last30d) {
    const [
        totalLogs,
        logs24h,
        logs7d,
        logs30d,
        activityByAction,
        errorLogs,
        securityLogs
    ] = await Promise.all([
        ActivityLog.countDocuments(),
        ActivityLog.countDocuments({ timestamp: { $gte: last24h } }),
        ActivityLog.countDocuments({ timestamp: { $gte: last7d } }),
        ActivityLog.countDocuments({ timestamp: { $gte: last30d } }),
        ActivityLog.aggregate([
            { 
                $match: { timestamp: { $gte: last7d } }
            },
            { 
                $group: { _id: '$action', count: { $sum: 1 } } 
            },
            { 
                $sort: { count: -1 } 
            },
            { 
                $limit: 10 
            }
        ]),
        ActivityLog.countDocuments({ 
            status: 'error',
            timestamp: { $gte: last7d }
        }),
        ActivityLog.countDocuments({ 
            severity: { $gte: 4 },
            timestamp: { $gte: last7d }
        })
    ]);

    return {
        total: totalLogs,
        recent: {
            last24h: logs24h,
            last7d: logs7d,
            last30d: logs30d
        },
        topActions: activityByAction,
        errors: errorLogs,
        securityEvents: securityLogs
    };
}

/**
 * Get engagement statistics
 */
async function getEngagementStatistics() {
    const [
        totalViews,
        totalLikes,
        avgViewsPerContent,
        topViewedContent,
        engagementTrends
    ] = await Promise.all([
        // Total views across all content
        Blog.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]).then(result => result[0]?.total || 0),
        
        // Total likes across all content
        Blog.aggregate([
            { $group: { _id: null, total: { $sum: '$likes' } } }
        ]).then(result => result[0]?.total || 0),
        
        // Average views per content
        Blog.aggregate([
            { $group: { _id: null, avg: { $avg: '$views' } } }
        ]).then(result => Math.round(result[0]?.avg || 0)),
        
        // Top viewed content
        Blog.find()
            .sort({ views: -1 })
            .limit(5)
            .select('title views likes createdAt'),
            
        // Engagement trends over last 30 days
        Blog.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    totalViews: { $sum: '$views' },
                    totalLikes: { $sum: '$likes' },
                    contentCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    return {
        totalViews,
        totalLikes,
        avgViewsPerContent,
        topContent: topViewedContent,
        trends: engagementTrends
    };
}

/**
 * Get system statistics
 */
async function getSystemStatistics() {
    const db = mongoose.connection.db;
    
    try {
        // Get database statistics
        const dbStats = await db.stats();
        
        // Get GridFS file statistics
        const gridfsStats = await db.collection('fs.files').aggregate([
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$length' },
                    avgSize: { $avg: '$length' }
                }
            }
        ]).toArray();

        // Get notification statistics
        const notificationStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            database: {
                size: dbStats.dataSize,
                collections: dbStats.collections,
                indexes: dbStats.indexes,
                avgObjSize: Math.round(dbStats.avgObjSize || 0)
            },
            storage: {
                totalFiles: gridfsStats[0]?.totalFiles || 0,
                totalSize: gridfsStats[0]?.totalSize || 0,
                avgFileSize: Math.round(gridfsStats[0]?.avgSize || 0)
            },
            notifications: notificationStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('Error getting system statistics:', error);
        return {
            database: {},
            storage: {},
            notifications: {}
        };
    }
}

/**
 * Get recent activities
 */
async function getRecentActivities() {
    return await ActivityLog.find()
        .populate('userId', 'username email companyEmail')
        .sort({ timestamp: -1 })
        .limit(20)
        .select('timestamp userId username action resource status severity details');
}

/**
 * Get top content
 */
async function getTopContent() {
    const [topBlogs, topNews, topEvents] = await Promise.all([
        Blog.find({ published: true })
            .sort({ views: -1, likes: -1 })
            .limit(5)
            .select('title views likes createdAt author'),
        
        News.find({ published: true })
            .sort({ views: -1, likes: -1 })
            .limit(5)
            .select('title views likes createdAt author'),
            
        Event.find({ published: true })
            .sort({ views: -1 })
            .limit(5)
            .select('title views startDate location organizer')
    ]);

    return {
        blogs: topBlogs,
        news: topNews,
        events: topEvents
    };
}

/**
 * Helper function to get model statistics
 */
async function getModelStats(Model, last24h, last7d, last30d) {
    const [total, new24h, new7d, new30d] = await Promise.all([
        Model.countDocuments(),
        Model.countDocuments({ createdAt: { $gte: last24h } }),
        Model.countDocuments({ createdAt: { $gte: last7d } }),
        Model.countDocuments({ createdAt: { $gte: last30d } })
    ]);

    return {
        total,
        new: {
            last24h: new24h,
            last7d: new7d,
            last30d: new30d
        }
    };
}

/**
 * Get real-time system metrics
 */
export const getSystemMetrics = async (req, res) => {
    try {
        const metrics = {
            timestamp: new Date(),
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            platform: process.platform,
            nodeVersion: process.version,
            
            // Database connection status
            database: {
                connected: mongoose.connection.readyState === 1,
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            },
            
            // Active connections (if available)
            activeConnections: mongoose.connection?.connections?.length || 0
        };

        res.json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('Error fetching system metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system metrics',
            error: error.message
        });
    }
};
