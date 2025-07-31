/**
 * @file Push Notification Management Controller
 * @description VAPID key management and push notification analytics
 * @module controllers/pushNotificationManagementController
 */

import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import crypto from 'crypto';
import webpush from 'web-push';

/**
 * Get VAPID keys configuration
 */
export const getVAPIDKeys = async (req, res) => {
    try {
        const vapidConfig = {
            publicKey: process.env.VAPID_PUBLIC_KEY || null,
            privateKey: process.env.VAPID_PRIVATE_KEY ? '***HIDDEN***' : null,
            email: process.env.VAPID_EMAIL || null,
            isConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
        };
        
        res.json({
            success: true,
            data: vapidConfig
        });
        
    } catch (error) {
        console.error('Error fetching VAPID keys:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch VAPID configuration',
            error: error.message
        });
    }
};

/**
 * Generate new VAPID keys
 */
export const generateVAPIDKeys = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for VAPID configuration'
            });
        }
        
        // Generate new VAPID keys
        const vapidKeys = webpush.generateVAPIDKeys();
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'vapid_keys_generated',
            resource: 'push_notification',
            details: {
                email,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        res.json({
            success: true,
            message: 'New VAPID keys generated successfully',
            data: {
                publicKey: vapidKeys.publicKey,
                privateKey: vapidKeys.privateKey,
                email,
                instructions: {
                    environment: 'Set these in your environment variables',
                    publicKey: 'VAPID_PUBLIC_KEY=' + vapidKeys.publicKey,
                    privateKey: 'VAPID_PRIVATE_KEY=' + vapidKeys.privateKey,
                    email: 'VAPID_EMAIL=' + email
                }
            }
        });
        
    } catch (error) {
        console.error('Error generating VAPID keys:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate VAPID keys',
            error: error.message
        });
    }
};

/**
 * Get push notification statistics
 */
export const getPushNotificationStats = async (req, res) => {
    try {
        const { timeframe = 30 } = req.query; // days
        const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        
        // Total notifications sent
        const totalNotifications = await Notification.countDocuments({
            createdAt: { $gte: startDate }
        });
        
        // Notifications by status
        const notificationsByStatus = await Notification.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Notifications by type
        const notificationsByType = await Notification.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Daily notification trends
        const dailyTrends = await Notification.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    sent: { $sum: 1 },
                    read: { $sum: { $cond: ['$isRead', 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Get push subscription logs from ActivityLog
        const pushLogs = await ActivityLog.aggregate([
            {
                $match: {
                    action: { $in: ['push_notification_sent', 'push_subscription_created', 'push_notification_failed'] },
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Calculate engagement rate
        const totalRead = notificationsByStatus.find(s => s._id === 'read')?.count || 0;
        const engagementRate = totalNotifications > 0 ? ((totalRead / totalNotifications) * 100).toFixed(2) : 0;
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalNotifications,
                    engagementRate: parseFloat(engagementRate),
                    timeframeDays: parseInt(timeframe)
                },
                byStatus: notificationsByStatus,
                byType: notificationsByType,
                dailyTrends,
                pushLogs
            }
        });
        
    } catch (error) {
        console.error('Error fetching push notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch push notification statistics',
            error: error.message
        });
    }
};

/**
 * Get push subscriptions analytics
 */
export const getPushSubscriptionsAnalytics = async (req, res) => {
    try {
        // Get subscription data from ActivityLog
        const { timeframe = 30 } = req.query;
        const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        
        // Subscription creation trends
        const subscriptionTrends = await ActivityLog.aggregate([
            {
                $match: {
                    action: 'push_subscription_created',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    newSubscriptions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Browser/device analytics
        const browserStats = await ActivityLog.aggregate([
            {
                $match: {
                    action: 'push_subscription_created',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$userAgent',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Failed subscriptions
        const failedSubscriptions = await ActivityLog.find({
            action: 'push_subscription_failed',
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 }).limit(20);
        
        res.json({
            success: true,
            data: {
                subscriptionTrends,
                browserStats,
                failedSubscriptions,
                timeframeDays: parseInt(timeframe)
            }
        });
        
    } catch (error) {
        console.error('Error fetching subscription analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription analytics',
            error: error.message
        });
    }
};

/**
 * Test push notification
 */
export const testPushNotification = async (req, res) => {
    try {
        const { title, body, url, testUserId } = req.body;
        
        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Title and body are required'
            });
        }
        
        // Create test notification
        const notification = new Notification({
            userId: testUserId || req.user._id,
            title,
            body,
            type: 'test',
            data: {
                url: url || '/',
                testMode: true,
                testTimestamp: new Date().toISOString()
            },
            status: 'sent'
        });
        
        await notification.save();
        
        // Log test activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'push_notification_test_sent',
            resource: 'push_notification',
            details: {
                notificationId: notification._id,
                title,
                body,
                testUserId,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.json({
            success: true,
            message: 'Test push notification sent successfully',
            data: {
                notificationId: notification._id,
                title,
                body
            }
        });
        
    } catch (error) {
        console.error('Error sending test push notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test push notification',
            error: error.message
        });
    }
};

/**
 * Get push notification delivery reports
 */
export const getPushDeliveryReports = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, type } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        
        const notifications = await Notification.find(query)
            .populate('userId', 'username email companyEmail')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Notification.countDocuments(query);
        
        // Add delivery status analysis
        const deliveryAnalysis = await Notification.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgDeliveryTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                deliveryAnalysis
            }
        });
        
    } catch (error) {
        console.error('Error fetching delivery reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery reports',
            error: error.message
        });
    }
};

/**
 * Get push notification system health
 */
export const getPushSystemHealth = async (req, res) => {
    try {
        // Check VAPID configuration
        const vapidConfigured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
        
        // Recent delivery failures
        const recentFailures = await ActivityLog.find({
            action: 'push_notification_failed',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ timestamp: -1 }).limit(10);
        
        // Delivery success rate (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deliveryStats = await ActivityLog.aggregate([
            {
                $match: {
                    action: { $in: ['push_notification_sent', 'push_notification_failed'] },
                    timestamp: { $gte: oneDayAgo }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalDeliveries = deliveryStats.reduce((sum, stat) => sum + stat.count, 0);
        const successfulDeliveries = deliveryStats.find(s => s._id === 'push_notification_sent')?.count || 0;
        const successRate = totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(2) : 100;
        
        res.json({
            success: true,
            data: {
                systemHealth: {
                    vapidConfigured,
                    successRate: parseFloat(successRate),
                    totalDeliveries,
                    successfulDeliveries,
                    failedDeliveries: totalDeliveries - successfulDeliveries
                },
                recentFailures,
                lastCheck: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error checking push system health:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check push system health',
            error: error.message
        });
    }
};
