/**
 * @file Data Export Controller
 * @description Export tools for logs, user data, and content analytics
 * @module controllers/dataExportController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import Notification from '../models/Notification.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

/**
 * Export user data
 */
export const exportUsers = async (req, res) => {
    try {
        const { format = 'csv', includeInactive = false } = req.query;
        
        const query = {};
        if (!includeInactive) {
            query.isActive = true;
        }
        
        const users = await User.find(query)
            .select('-password -passwordHistory -sessions')
            .sort({ createdAt: -1 });
        
        // Prepare data for export
        const exportData = users.map(user => ({
            id: user._id,
            username: user.username || '',
            email: user.email || '',
            companyEmail: user.companyEmail || '',
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: user.fullName || '',
            isActive: user.isActive,
            loginCount: user.loginCount || 0,
            lastLogin: user.lastLogin || '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            permissions: user.permissions?.join('; ') || ''
        }));
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'users_data_exported',
            resource: 'user',
            details: {
                format,
                userCount: exportData.length,
                includeInactive,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, exportData, 'users', 'Users Export');
        } else {
            return exportToCSV(res, exportData, 'users');
        }
        
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export users',
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
            format = 'csv', 
            startDate, 
            endDate, 
            action, 
            userId, 
            limit = 10000 
        } = req.query;
        
        const query = {};
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        if (action) query.action = action;
        if (userId) query.userId = userId;
        
        const logs = await ActivityLog.find(query)
            .populate('userId', 'username email companyEmail role')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        // Prepare data for export
        const exportData = logs.map(log => ({
            id: log._id,
            timestamp: log.timestamp,
            userId: log.userId?._id || log.userId || '',
            username: log.userId?.username || log.username || '',
            email: log.userId?.email || '',
            companyEmail: log.userId?.companyEmail || '',
            userRole: log.userRole,
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId || '',
            resourceTitle: log.resourceTitle || '',
            status: log.status,
            severity: log.severity,
            ipAddress: log.ipAddress || '',
            userAgent: log.userAgent || '',
            details: JSON.stringify(log.details || {})
        }));
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'activity_logs_exported',
            resource: 'activity_log',
            details: {
                format,
                logCount: exportData.length,
                filters: { startDate, endDate, action, userId },
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, exportData, 'activity-logs', 'Activity Logs Export');
        } else {
            return exportToCSV(res, exportData, 'activity-logs');
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

/**
 * Export content analytics
 */
export const exportContentAnalytics = async (req, res) => {
    try {
        const { format = 'csv', type = 'all' } = req.query;
        
        const contentData = [];
        
        // Export blogs
        if (type === 'all' || type === 'blogs') {
            const blogs = await Blog.find().sort({ createdAt: -1 });
            blogs.forEach(blog => {
                contentData.push({
                    type: 'blog',
                    id: blog._id,
                    title: blog.title,
                    author: blog.author || '',
                    category: blog.category || '',
                    tags: blog.tags?.join('; ') || '',
                    views: blog.views || 0,
                    likes: blog.likes || 0,
                    readingTime: blog.readingTime || '',
                    published: blog.published,
                    createdAt: blog.createdAt,
                    updatedAt: blog.updatedAt,
                    contentLength: blog.content?.length || 0
                });
            });
        }
        
        // Export news
        if (type === 'all' || type === 'news') {
            const news = await News.find().sort({ createdAt: -1 });
            news.forEach(item => {
                contentData.push({
                    type: 'news',
                    id: item._id,
                    title: item.title,
                    author: item.author || '',
                    category: item.category || '',
                    tags: item.tags?.join('; ') || '',
                    views: item.views || 0,
                    likes: item.likes || 0,
                    readingTime: item.readingTime || '',
                    published: item.published,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    contentLength: item.content?.length || 0
                });
            });
        }
        
        // Export events
        if (type === 'all' || type === 'events') {
            const events = await Event.find().sort({ startDate: -1 });
            events.forEach(event => {
                contentData.push({
                    type: 'event',
                    id: event._id,
                    title: event.title,
                    author: event.organizer || '',
                    category: event.category || '',
                    tags: event.tags?.join('; ') || '',
                    views: event.views || 0,
                    likes: event.likes || 0,
                    readingTime: '',
                    published: event.published,
                    createdAt: event.createdAt,
                    updatedAt: event.updatedAt,
                    contentLength: event.description?.length || 0,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    location: event.location || '',
                    registrationCount: event.registrations?.length || 0
                });
            });
        }
        
        // Sort by creation date
        contentData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'content_analytics_exported',
            resource: 'content',
            details: {
                format,
                type,
                contentCount: contentData.length,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, contentData, 'content-analytics', 'Content Analytics Export');
        } else {
            return exportToCSV(res, contentData, 'content-analytics');
        }
        
    } catch (error) {
        console.error('Error exporting content analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export content analytics',
            error: error.message
        });
    }
};

/**
 * Export subscribers data
 */
export const exportSubscribers = async (req, res) => {
    try {
        const { format = 'csv', status = 'all' } = req.query;
        
        const query = {};
        if (status !== 'all') {
            query.isActive = status === 'active';
        }
        
        const subscribers = await Subscriber.find(query).sort({ createdAt: -1 });
        
        // Prepare data for export
        const exportData = subscribers.map(subscriber => ({
            id: subscriber._id,
            email: subscriber.email,
            isActive: subscriber.isActive,
            subscriptionType: subscriber.subscriptionType?.join('; ') || '',
            preferences: JSON.stringify(subscriber.preferences || {}),
            source: subscriber.source || '',
            ipAddress: subscriber.ipAddress || '',
            userAgent: subscriber.userAgent || '',
            confirmedAt: subscriber.confirmedAt || '',
            unsubscribedAt: subscriber.unsubscribedAt || '',
            createdAt: subscriber.createdAt,
            updatedAt: subscriber.updatedAt
        }));
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'subscribers_exported',
            resource: 'subscriber',
            details: {
                format,
                subscriberCount: exportData.length,
                status,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, exportData, 'subscribers', 'Subscribers Export');
        } else {
            return exportToCSV(res, exportData, 'subscribers');
        }
        
    } catch (error) {
        console.error('Error exporting subscribers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export subscribers',
            error: error.message
        });
    }
};

/**
 * Export notifications data
 */
export const exportNotifications = async (req, res) => {
    try {
        const { format = 'csv', type, status, limit = 5000 } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        
        const notifications = await Notification.find(query)
            .populate('userId', 'username email companyEmail')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        // Prepare data for export
        const exportData = notifications.map(notification => ({
            id: notification._id,
            userId: notification.userId?._id || '',
            username: notification.userId?.username || '',
            email: notification.userId?.email || '',
            companyEmail: notification.userId?.companyEmail || '',
            type: notification.type,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            isRead: notification.isRead,
            data: JSON.stringify(notification.data || {}),
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            readAt: notification.readAt || ''
        }));
        
        // Log export activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'notifications_exported',
            resource: 'notification',
            details: {
                format,
                notificationCount: exportData.length,
                filters: { type, status },
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, exportData, 'notifications', 'Notifications Export');
        } else {
            return exportToCSV(res, exportData, 'notifications');
        }
        
    } catch (error) {
        console.error('Error exporting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export notifications',
            error: error.message
        });
    }
};

/**
 * Generate comprehensive system report
 */
export const generateSystemReport = async (req, res) => {
    try {
        const { format = 'excel' } = req.query;
        
        // Gather system statistics
        const stats = {
            users: {
                total: await User.countDocuments(),
                active: await User.countDocuments({ isActive: true }),
                byRole: await User.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } }
                ])
            },
            content: {
                blogs: await Blog.countDocuments(),
                news: await News.countDocuments(),
                events: await Event.countDocuments(),
                newsletters: await Newsletter.countDocuments()
            },
            subscribers: {
                total: await Subscriber.countDocuments(),
                active: await Subscriber.countDocuments({ isActive: true })
            },
            activity: {
                totalLogs: await ActivityLog.countDocuments(),
                last24h: await ActivityLog.countDocuments({
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }),
                last7d: await ActivityLog.countDocuments({
                    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            }
        };
        
        // Prepare report data
        const reportData = [
            { metric: 'Total Users', value: stats.users.total },
            { metric: 'Active Users', value: stats.users.active },
            { metric: 'Total Blogs', value: stats.content.blogs },
            { metric: 'Total News', value: stats.content.news },
            { metric: 'Total Events', value: stats.content.events },
            { metric: 'Total Newsletters', value: stats.content.newsletters },
            { metric: 'Total Subscribers', value: stats.subscribers.total },
            { metric: 'Active Subscribers', value: stats.subscribers.active },
            { metric: 'Total Activity Logs', value: stats.activity.totalLogs },
            { metric: 'Activity Last 24h', value: stats.activity.last24h },
            { metric: 'Activity Last 7d', value: stats.activity.last7d }
        ];
        
        // Log report generation
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'system_report_generated',
            resource: 'system',
            details: {
                format,
                stats,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        if (format === 'excel') {
            return exportToExcel(res, reportData, 'system-report', 'System Report');
        } else {
            return exportToCSV(res, reportData, 'system-report');
        }
        
    } catch (error) {
        console.error('Error generating system report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate system report',
            error: error.message
        });
    }
};

// Helper functions for file exports
async function exportToCSV(res, data, filename) {
    try {
        const parser = new Parser();
        const csv = parser.parse(data);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        throw new Error('Failed to generate CSV: ' + error.message);
    }
}

async function exportToExcel(res, data, filename, sheetName) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        
        if (data.length > 0) {
            // Add headers
            const headers = Object.keys(data[0]);
            worksheet.addRow(headers);
            
            // Style headers
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            // Add data
            data.forEach(row => {
                worksheet.addRow(Object.values(row));
            });
            
            // Auto-fit columns
            worksheet.columns.forEach(column => {
                column.width = Math.max(
                    column.header?.length || 0,
                    ...data.map(row => String(row[column.key] || '').length)
                ) + 2;
            });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        throw new Error('Failed to generate Excel: ' + error.message);
    }
}
