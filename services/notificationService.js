/**
 * Notification Service
 * 
 * This service manages the creation, delivery, and tracking of notifications
 * for the farming magazine platform. It supports both in-app notifications and
 * email notifications for different types of content updates (blogs, news, events, etc.).
 * 
 * The service handles:
 * - Creating notifications when new content is published
 * - Sending email notifications to subscribers
 * - Managing notification preferences
 * - Tracking notification delivery and open rates
 * - Batching notifications to prevent overwhelming users
 * 
 * @module services/notificationService
 */
import nodemailer from 'nodemailer';
import Subscriber from '../models/Subscriber.js';
import Notification from '../models/Notification.js';

/**
 * Creates and configures a Nodemailer transporter for sending notification emails
 * 
 * Uses a connection pool for better performance when sending multiple notifications
 * and implements rate limiting to prevent being flagged as spam.
 * 
 * @returns {nodemailer.Transporter} Configured email transporter
 */
const createTransporter = () => {
  // Check for required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing email configuration: EMAIL_USER or EMAIL_PASS not set');
    throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }

  const config = {
    host: process.env.EMAIL_HOST || 'mail.ishaazilivestockservices.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14,
    // Railway-specific optimizations
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    socketTimeout: 60000       // 60 seconds
  };

  console.log('📧 Email transporter configured:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    secure: config.secure
  });

  return nodemailer.createTransporter(config);
};

/**
 * Creates an HTML email template for content notifications
 * 
 * Generates a responsive HTML email with content information, appropriate styling
 * based on content type, and tracking pixel for open rate analytics.
 * 
 * @param {string} title - The title of the content being notified about
 * @param {string} description - Brief description or excerpt of the content
 * @param {string} contentType - Type of content (blog, news, event, magazine)
 * @param {string} contentUrl - URL to view the full content
 * @param {string} subscriberEmail - Email of the subscriber (for tracking)
 * @param {string|null} notificationId - Optional ID for tracking notification opens
 * @returns {string} Complete HTML template for the notification email
 */
const createNotificationTemplate = (title, description, contentType, contentUrl, subscriberEmail, notificationId = null) => {
  // Use environment-appropriate base URL for tracking
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.BASE_URL || 'https://ishaazilivestockservices-production.up.railway.app')
    : 'http://localhost:5000';
    
  const trackingPixelUrl = notificationId ? 
    `${baseUrl}/api/email/track/open/notification/${notificationId}/${encodeURIComponent(subscriberEmail)}` : '';
  
  const contentTypeLabels = {
    blog: '📝 New Blog Post',
    news: '📰 Latest News',
    event: '📅 New Event',
    magazine: '📖 New Magazine Issue'
  };

  const contentIcon = {
    blog: '📝',
    news: '📰', 
    event: '📅',
    magazine: '📖'
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Content Alert - ${title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .notification-box {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .content-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin: 0 0 10px 0;
        }
        .content-type {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .description {
            color: #475569;
            line-height: 1.7;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(59, 130, 246, 0.35);
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .unsubscribe {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        .unsubscribe a {
            color: #3b82f6;
            text-decoration: none;
        }
        .tracking-pixel {
            width: 1px;
            height: 1px;
            border: 0;
            display: block;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .content-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌾 New Content Alert</h1>
            <p>Fresh content from Ishaazi Livestock Services</p>
        </div>
        
        <div class="content">
            <div class="notification-box">
                <div class="content-type">${contentIcon[contentType]} ${contentTypeLabels[contentType] || 'New Content'}</div>
                <h2 class="content-title">${title}</h2>
                <p class="description">${description}</p>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${contentUrl}?utm_source=notification&utm_content=${contentType}" class="cta-button" onclick="trackClick('read-more', '${notificationId}', '${encodeURIComponent(subscriberEmail)}')">
                        ${contentType === 'event' ? 'View Event Details' : 'Read Full Article'}
                    </a>
                </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
                This is an automated notification because you're subscribed to our content updates.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Ishaazi Livestock Services</strong></p>
            <p>📧 info@ishaazilivestockservices.com | 📞 +256 780 702 921</p>
            <p>🏢 Kampala, Uganda</p>
            
            <div class="unsubscribe">
                <p>You're receiving this because you subscribed to content notifications.</p>
                <p>Email sent to: ${subscriberEmail}</p>
                <p>
                    <a href="${baseUrl}/api/content/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&source=notification">Unsubscribe</a> | 
                    <a href="${baseUrl}/api/content/preferences?email=${encodeURIComponent(subscriberEmail)}">Manage Preferences</a>
                </p>
            </div>
        </div>
    </div>
    
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" alt="" class="tracking-pixel" />` : ''}
    
    <script>
        function trackClick(action, notificationId, subscriberEmail) {
            if (notificationId) {
                fetch(\`${baseUrl}/api/email/track/click/notification/\${notificationId}/\${subscriberEmail}?action=\${action}\`, {
                    method: 'POST'
                }).catch(e => console.log('Tracking failed:', e));
            }
        }
    </script>
</body>
</html>`;
};

// Send automated notification to subscribers
export const sendContentNotification = async (contentType, contentId, title, description, targetSubscriptionTypes = ['all']) => {
  try {
    // Create notification record
    const notification = new Notification({
      type: 'content_published',
      contentType,
      contentId,
      title,
      description,
      targetSubscriptionTypes
    });
    await notification.save();

    // Get relevant subscribers
    const subscriberQuery = { isActive: true };
    
    if (!targetSubscriptionTypes.includes('all')) {
      subscriberQuery.subscriptionType = { $in: targetSubscriptionTypes };
    }

    const subscribers = await Subscriber.find(subscriberQuery);
    
    if (subscribers.length === 0) {
      notification.status = 'failed';
      notification.errorMessage = 'No subscribers found';
      await notification.save();
      return { success: false, message: 'No subscribers found' };
    }

    // Generate content URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.BASE_URL || 'https://ishaazilivestockservices-production.up.railway.app')
      : 'http://localhost:3000';
    const contentUrl = `${baseUrl}/${contentType}/${contentId}`;
    
    // Send emails in batches with Railway optimizations
    const transporter = createTransporter();
    const BATCH_SIZE = 10; // Reduced for Railway
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds for Railway

    let totalSent = 0;
    let totalFailed = 0;
    const errors = [];

    console.log(`📧 Sending notification to ${subscribers.length} subscribers in batches of ${BATCH_SIZE}`);

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      console.log(`📧 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(subscribers.length/BATCH_SIZE)}`);
      
      const emailPromises = batch.map(async (subscriber) => {
        try {
          const htmlContent = createNotificationTemplate(
            title, 
            description, 
            contentType, 
            contentUrl, 
            subscriber.email, 
            notification._id
          );
          
          await transporter.sendMail({
            from: `"Ishaazi Livestock Services" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
            to: subscriber.email,
            subject: `🌾 New ${contentType}: ${title}`,
            html: htmlContent,
            // Railway-specific mail options
            priority: 'normal',
            envelope: {
              from: process.env.EMAIL_USER,
              to: subscriber.email
            }
          });
          
          return { success: true, email: subscriber.email };
        } catch (error) {
          console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
          return { success: false, email: subscriber.email, error: error.message };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          totalSent++;
        } else {
          totalFailed++;
          errors.push({
            email: result.value?.email || 'unknown',
            error: result.value?.error || result.reason?.message || 'Unknown error'
          });
        }
      });

      // Delay between batches for Railway
      if (i + BATCH_SIZE < subscribers.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    console.log(`✅ Notification complete: ${totalSent} sent, ${totalFailed} failed`);

    // Update notification status
    notification.status = totalSent > 0 ? 'sent' : 'failed';
    notification.sentTo = totalSent;
    notification.sentAt = new Date();
    if (totalFailed > 0) {
      notification.errorMessage = `${totalFailed} emails failed to send`;
    }
    await notification.save();

    // Update subscriber analytics
    if (totalSent > 0) {
      await Subscriber.updateMany(
        { _id: { $in: subscribers.map(s => s._id) } },
        { 
          $inc: { emailsSent: 1 },
          $set: { lastEmailSent: new Date() }
        }
      );
    }

    return {
      success: totalSent > 0,
      message: `Notification sent to ${totalSent} subscribers${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`,
      data: {
        sent: totalSent,
        failed: totalFailed,
        errors: errors.slice(0, 5) // Limit error details
      }
    };

  } catch (error) {
    console.error('Error sending content notification:', error);
    return {
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    };
  }
};

export default {
  sendContentNotification
};
