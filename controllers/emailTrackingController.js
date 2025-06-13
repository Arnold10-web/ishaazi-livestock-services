/**
 * @file Email Tracking Controller
 * @description Handles email and notification tracking functionality:
 *  - Tracking email opens via transparent pixel
 *  - Tracking email link clicks
 *  - Tracking notification views and interactions
 *  - Generating analytics reports for email campaigns
 *  - Updating subscriber engagement metrics
 * @module controllers/emailTrackingController
 */

import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import Notification from '../models/Notification.js';

/**
 * @function trackEmailOpen
 * @description Records email opens using a transparent tracking pixel
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.newsletterId - ID of the newsletter being tracked
 * @param {string} req.params.email - URL-encoded email address of the recipient
 * @param {Object} res - Express response object
 * @returns {Buffer} 1x1 transparent PNG tracking pixel
 */
export const trackEmailOpen = async (req, res) => {
  try {
    const { newsletterId, email } = req.params;
    
    // Update newsletter open count
    await Newsletter.findByIdAndUpdate(
      newsletterId,
      { $inc: { openCount: 1 } }
    );

    // Update subscriber open count
    await Subscriber.findOneAndUpdate(
      { email: decodeURIComponent(email) },
      { 
        $inc: { openCount: 1 },
        $set: { lastOpened: new Date() }
      }
    );

    // Return 1x1 transparent tracking pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return tracking pixel even if database update fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length
    });
    res.send(pixel);
  }
};

/**
 * @function trackEmailClick
 * @description Records when recipients click links in emails
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.newsletterId - ID of the newsletter being tracked
 * @param {string} req.params.email - URL-encoded email address of the recipient
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.platform] - Device/platform information
 * @param {Object} res - Express response object
 * @returns {Object} JSON confirmation response
 */
export const trackEmailClick = async (req, res) => {
  try {
    const { newsletterId, email } = req.params;
    const { platform } = req.query;
    
    // Update newsletter click count
    await Newsletter.findByIdAndUpdate(
      newsletterId,
      { $inc: { clickCount: 1 } }
    );

    // Update subscriber click count
    await Subscriber.findOneAndUpdate(
      { email: decodeURIComponent(email) },
      { 
        $inc: { clickCount: 1 },
        $set: { lastClicked: new Date() }
      }
    );

    // Log the click for analytics
    console.log(`📊 Click tracked: Newsletter ${newsletterId}, Email ${email}, Platform: ${platform}`);

    res.status(200).json({ 
      success: true, 
      message: 'Click tracked successfully' 
    });
  } catch (error) {
    console.error('Error tracking email click:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to track click',
      error: error.message 
    });
  }
};

/**
 * @function trackNotificationOpen
 * @description Records notification opens using a tracking pixel
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.notificationId - ID of the notification being tracked
 * @param {string} req.params.email - URL-encoded email address of the recipient
 * @param {Object} res - Express response object
 * @returns {Buffer} 1x1 transparent PNG tracking pixel
 */
export const trackNotificationOpen = async (req, res) => {
  try {
    const { notificationId, email } = req.params;
    
    // Update notification open count
    await Notification.findByIdAndUpdate(
      notificationId,
      { $inc: { 'analytics.opens': 1 } }
    );

    // Update subscriber open count
    await Subscriber.findOneAndUpdate(
      { email: decodeURIComponent(email) },
      { 
        $inc: { openCount: 1 },
        $set: { lastOpened: new Date() }
      }
    );

    // Return 1x1 transparent tracking pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(pixel);
  } catch (error) {
    console.error('Error tracking notification open:', error);
    // Still return tracking pixel even if database update fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length
    });
    res.send(pixel);
  }
};

/**
 * @function trackNotificationClick
 * @description Records when users click on notification links
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.notificationId - ID of the notification being tracked
 * @param {string} req.params.email - URL-encoded email address of the recipient
 * @param {string} req.params.url - URL that was clicked (encoded)
 * @param {Object} res - Express response object
 * @returns {Object} JSON confirmation response
 */
export const trackNotificationClick = async (req, res) => {
  try {
    const { notificationId, email, url } = req.params;
    
    // Update notification click count
    await Notification.findByIdAndUpdate(
      notificationId,
      { $inc: { 'analytics.clicks': 1 } }
    );

    // Update subscriber click count
    await Subscriber.findOneAndUpdate(
      { email: decodeURIComponent(email) },
      { 
        $inc: { clickCount: 1 },
        $set: { lastClicked: new Date() }
      }
    );

    // Redirect to the target URL
    const decodedUrl = decodeURIComponent(url);
    res.redirect(decodedUrl);
  } catch (error) {
    console.error('Error tracking notification click:', error);
    // Redirect to the URL even if tracking fails
    const decodedUrl = decodeURIComponent(req.params.url);
    res.redirect(decodedUrl);
  }
};

/**
 * @function getNewsletterAnalytics
 * @description Retrieves detailed performance metrics for a specific newsletter
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.newsletterId - ID of the newsletter to analyze
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with newsletter analytics
 */
export const getNewsletterAnalytics = async (req, res) => {
  try {
    const { newsletterId } = req.params;
    
    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found'
      });
    }

    // Calculate engagement rates
    const sentTo = newsletter.sentTo || 0;
    const openRate = sentTo > 0 ? ((newsletter.openCount || 0) / sentTo * 100).toFixed(2) : 0;
    const clickRate = sentTo > 0 ? ((newsletter.clickCount || 0) / sentTo * 100).toFixed(2) : 0;
    const clickThroughRate = newsletter.openCount > 0 ? 
      ((newsletter.clickCount || 0) / newsletter.openCount * 100).toFixed(2) : 0;

    const analytics = {
      newsletterId,
      title: newsletter.title,
      status: newsletter.status,
      sentAt: newsletter.sentAt,
      sentTo,
      openCount: newsletter.openCount || 0,
      clickCount: newsletter.clickCount || 0,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`,
      clickThroughRate: `${clickThroughRate}%`
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting newsletter analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

/**
 * @function getOverallEmailAnalytics
 * @description Generates comprehensive analytics for all email campaigns
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.timeframe='30d'] - Time period for analytics (7d, 30d, 90d, etc.)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with aggregated email campaign analytics
 */
export const getOverallEmailAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get newsletter stats
    const newsletterStats = await Newsletter.aggregate([
      {
        $match: {
          status: 'sent',
          sentAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalNewsletters: { $sum: 1 },
          totalSent: { $sum: '$sentTo' },
          totalOpens: { $sum: '$openCount' },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    // Get subscriber stats
    const subscriberStats = await Subscriber.aggregate([
      {
        $group: {
          _id: null,
          totalSubscribers: { $sum: 1 },
          activeSubscribers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalEmailsSent: { $sum: '$emailsSent' },
          totalOpens: { $sum: '$openCount' },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    const stats = newsletterStats[0] || {};
    const subStats = subscriberStats[0] || {};

    // Calculate rates
    const totalSent = stats.totalSent || 0;
    const overallOpenRate = totalSent > 0 ? 
      ((stats.totalOpens || 0) / totalSent * 100).toFixed(2) : 0;
    const overallClickRate = totalSent > 0 ? 
      ((stats.totalClicks || 0) / totalSent * 100).toFixed(2) : 0;

    const analytics = {
      timeframe,
      period: {
        start: startDate,
        end: now
      },
      newsletters: {
        sent: stats.totalNewsletters || 0,
        totalRecipients: totalSent,
        totalOpens: stats.totalOpens || 0,
        totalClicks: stats.totalClicks || 0,
        openRate: `${overallOpenRate}%`,
        clickRate: `${overallClickRate}%`
      },
      subscribers: {
        total: subStats.totalSubscribers || 0,
        active: subStats.activeSubscribers || 0,
        engagement: {
          totalEmailsReceived: subStats.totalEmailsSent || 0,
          totalOpens: subStats.totalOpens || 0,
          totalClicks: subStats.totalClicks || 0
        }
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting overall email analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

/**
 * Default export of all email tracking controller functions
 * @exports {Object} Email tracking controller functions
 */
export default {
  trackEmailOpen,
  trackEmailClick,
  trackNotificationOpen,
  trackNotificationClick,
  getNewsletterAnalytics,
  getOverallEmailAnalytics
};
