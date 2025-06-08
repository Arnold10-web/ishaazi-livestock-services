// controllers/notificationController.js
import Notification from '../models/Notification.js';
import { sendContentNotification } from '../services/notificationService.js';

// Get all notifications with analytics
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contentType } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Notification.countDocuments(query);
    
    // Calculate analytics
    const analytics = await Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalSent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalRecipients: { $sum: '$sentTo' },
          totalOpens: { $sum: '$openCount' },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);
    
    const stats = analytics[0] || {
      totalNotifications: 0,
      totalSent: 0,
      totalFailed: 0,
      totalRecipients: 0,
      totalOpens: 0,
      totalClicks: 0
    };
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit)
        },
        analytics: {
          ...stats,
          openRate: stats.totalRecipients > 0 ? (stats.totalOpens / stats.totalRecipients * 100).toFixed(2) : 0,
          clickRate: stats.totalRecipients > 0 ? (stats.totalClicks / stats.totalRecipients * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get notification analytics dashboard data
export const getNotificationAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Get notifications in timeframe
    const notifications = await Notification.find({
      createdAt: { $gte: startDate }
    });
    
    // Calculate summary stats
    const summary = {
      totalNotifications: notifications.length,
      totalSent: notifications.filter(n => n.status === 'sent').length,
      totalFailed: notifications.filter(n => n.status === 'failed').length,
      totalRecipients: notifications.reduce((sum, n) => sum + n.sentTo, 0),
      totalOpens: notifications.reduce((sum, n) => sum + n.openCount, 0),
      totalClicks: notifications.reduce((sum, n) => sum + n.clickCount, 0)
    };
    
    summary.openRate = summary.totalRecipients > 0 ? 
      (summary.totalOpens / summary.totalRecipients * 100).toFixed(2) : 0;
    summary.clickRate = summary.totalRecipients > 0 ? 
      (summary.totalClicks / summary.totalRecipients * 100).toFixed(2) : 0;
    
    // Get notifications by content type
    const byContentType = notifications.reduce((acc, notification) => {
      const type = notification.contentType;
      if (!acc[type]) {
        acc[type] = { count: 0, sent: 0, recipients: 0 };
      }
      acc[type].count++;
      if (notification.status === 'sent') acc[type].sent++;
      acc[type].recipients += notification.sentTo;
      return acc;
    }, {});
    
    // Get daily activity for the timeframe
    const dailyActivity = [];
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayNotifications = notifications.filter(n => 
        n.createdAt >= dayStart && n.createdAt <= dayEnd
      );
      
      dailyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        notifications: dayNotifications.length,
        recipients: dayNotifications.reduce((sum, n) => sum + n.sentTo, 0),
        opens: dayNotifications.reduce((sum, n) => sum + n.openCount, 0),
        clicks: dayNotifications.reduce((sum, n) => sum + n.clickCount, 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        summary,
        byContentType,
        dailyActivity,
        timeframe
      }
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Manually trigger notification for specific content
export const triggerNotification = async (req, res) => {
  try {
    const { contentType, contentId, title, description, targetSubscriptionTypes } = req.body;
    
    if (!contentType || !contentId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Content type, ID, title, and description are required'
      });
    }
    
    const result = await sendContentNotification(
      contentType,
      contentId,
      title,
      description,
      targetSubscriptionTypes || ['all']
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error triggering notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger notification',
      error: error.message
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Resend failed notification
export const resendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend notifications that were already sent successfully'
      });
    }
    
    const result = await sendContentNotification(
      notification.contentType,
      notification.contentId,
      notification.title,
      notification.description,
      notification.targetSubscriptionTypes
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error resending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend notification',
      error: error.message
    });
  }
};

export default {
  getNotifications,
  getNotificationAnalytics,
  triggerNotification,
  deleteNotification,
  resendNotification
};
