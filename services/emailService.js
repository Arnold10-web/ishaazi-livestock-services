/**
 * Email Service - SendGrid API Integration
 */
import sgMail from '@sendgrid/mail';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.isInitialized = false;
    this.config = this.getEmailConfig();
    this.templates = new Map();
    this.initialize();
  }

  getEmailConfig() {
    const provider = process.env.EMAIL_SERVICE || 'sendgrid';
    
    console.log('[EMAIL] Email provider selected:', provider);
    console.log('[EMAIL] Environment variables check:', {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '[SET]' : '[NOT SET]',
      EMAIL_FROM: process.env.EMAIL_FROM ? '[SET]' : '[NOT SET]',
      EMAIL_SERVICE: process.env.EMAIL_SERVICE
    });
    
    return {
      provider,
      apiKey: process.env.SENDGRID_API_KEY,
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        address: process.env.EMAIL_FROM || 'system@ishaazilivestockservices.com'
      },
      replyTo: process.env.EMAIL_REPLY_TO || 'info@ishaazilivestockservices.com'
    };
  }

  async initialize() {
    try {
      if (!this.config.apiKey) {
        console.warn('[WARNING] SendGrid API key not configured properly. Check your SENDGRID_API_KEY environment variable.');
        console.warn('[INFO] Email service will continue in degraded mode - emails will not be sent');
        this.isInitialized = false;
        return; // Non-blocking - server can continue
      }

      sgMail.setApiKey(this.config.apiKey);
      
      this.isInitialized = true;
      
      console.log('[SUCCESS] SendGrid email service initialized successfully');
      
      await this.loadTemplates();
    } catch (error) {
      console.error('[ERROR] Email service initialization failed:', error.message);
      console.warn('[INFO] Email service will continue in degraded mode - emails will not be sent');
      this.isInitialized = false;
      // Non-blocking - don't throw error, just log it
    }
  }

  async loadTemplates() {
    try {
      const templatesPath = path.resolve(__dirname, '../templates/email');
      
      // Dynamically load all templates from directory
      const templateFiles = await fs.readdir(templatesPath);
      const htmlFiles = templateFiles.filter(file => file.endsWith('.html'));
      
      for (const file of htmlFiles) {
        const templateName = file.replace('.html', '');
        const template = await this.loadTemplate(file);
        this.templates.set(templateName, template);
      }
      
      console.log(`[SUCCESS] Loaded ${this.templates.size} email templates:`, Array.from(this.templates.keys()));
    } catch (error) {
      console.warn('[WARNING] Could not load email templates:', error.message);
      // Fallback to basic templates
      this.templates.set('newsletter', '<html><body>{{content}}</body></html>');
      this.templates.set('welcome-subscriber', '<html><body>Welcome {{subscriberEmail}}!</body></html>');
      this.templates.set('subscription-confirmation', '<html><body>Please confirm your subscription.</body></html>');
    }
  }

  async loadTemplate(filename) {
    try {
      const templatesPath = path.resolve(__dirname, '../templates/email');
      const templatePath = path.join(templatesPath, filename);
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.warn(`[WARNING] Could not load template ${filename}:`, error.message);
      return '<html><body>{{content}}</body></html>';
    }
  }

  renderTemplate(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }
    
    // Enhanced template rendering with nested object support
    let rendered = template;
    
    // Replace simple variables {{variable}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
    
    // Replace conditional blocks {{#if variable}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
      return data[condition] ? content : '';
    });
    
    // Add default unsubscribe and preference URLs if not provided
    if (!data.unsubscribe_url) {
      const baseUrl = process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com';
      data.unsubscribe_url = `${baseUrl}/unsubscribe?email=${encodeURIComponent(data.subscriberEmail || data.email || '')}`;
      data.manage_preferences_url = `${baseUrl}/preferences?email=${encodeURIComponent(data.subscriberEmail || data.email || '')}`;
    }
    
    // Second pass for any remaining variables
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });
    
    return rendered;
  }

  async sendEmail(options) {
    if (!options.to) {
      throw new Error('No recipients defined');
    }

    if (!this.isInitialized) {
      console.warn('[WARNING] Email service not initialized - email not sent');
      console.log('[INFO] Would have sent email to:', options.to);
      console.log('[INFO] Subject:', options.subject);
      return { success: false, message: 'Email service not available' };
    }

    const mailOptions = {
      from: {
        email: this.config.from.address,
        name: this.config.from.name
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: this.config.replyTo,
      
      // Enhanced SendGrid features
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true },
        ganalytics: { enable: false } // Can be enabled if you have GA
      },
      
      // Custom headers for tracking
      customArgs: {
        campaignId: options.campaignId || 'general',
        userId: options.userId || 'anonymous',
        emailType: options.emailType || 'transactional'
      },
      
      // Unsubscribe link
      asm: {
        groupId: options.unsubscribeGroupId || 1 // Default unsubscribe group
      }
    };

    // Add categories for analytics
    if (options.categories) {
      mailOptions.categories = Array.isArray(options.categories) 
        ? options.categories 
        : [options.categories];
    }

    // Add send time optimization
    if (options.sendAt) {
      mailOptions.sendAt = options.sendAt;
    }

    try {
      const result = await sgMail.send(mailOptions);
      console.log('[SUCCESS] Email sent successfully via SendGrid');
      
      // Update subscriber stats
      if (options.to) {
        await this.updateSubscriberStats(options.to, { sent: 1 });
      }
      
      return { 
        success: true, 
        messageId: result[0].headers['x-message-id'],
        tracking: {
          openTracking: mailOptions.trackingSettings.openTracking.enable,
          clickTracking: mailOptions.trackingSettings.clickTracking.enable
        }
      };
    } catch (error) {
      console.error('[ERROR] Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateSubscriberStats(email, stats) {
    try {
      const updateQuery = {};
      Object.keys(stats).forEach(key => {
        updateQuery[`stats.${key}`] = stats[key];
      });

      await import('../models/Subscriber.js').then(module => {
        const Subscriber = module.default;
        return Subscriber.findOneAndUpdate(
          { email },
          { 
            $inc: { ...updateQuery, emailsSent: stats.sent || 0 }
          },
          { upsert: false }
        );
      });
    } catch (error) {
      console.warn('[WARNING] Could not update subscriber stats:', error.message);
    }
  }

  async sendWelcomeEmailToEditor(companyEmail, tempPassword, createdBy) {
    try {
      const templateData = {
        adminEmail: companyEmail,
        temporaryPassword: tempPassword,
        createdBy: createdBy,
        loginUrl: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/admin/login`,
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('welcome-admin', templateData);
      
      return await this.sendEmail({
        to: companyEmail,
        subject: 'Welcome to Admin Portal - Account Created',
        html,
        emailType: 'admin-welcome',
        categories: ['admin', 'welcome']
      });
    } catch (error) {
      // Fallback to basic template
      const html = `<html><body><h1>Welcome to Admin Portal</h1><p>Email: ${companyEmail}</p><p>Password: ${tempPassword}</p></body></html>`;
      return await this.sendEmail({
        to: companyEmail,
        subject: 'Welcome to Admin Portal',
        html
      });
    }
  }

  async sendPasswordResetEmail(companyEmail, tempPassword, resetBy) {
    try {
      const templateData = {
        adminEmail: companyEmail,
        newPassword: tempPassword,
        resetBy: resetBy,
        loginUrl: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/admin/login`,
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('password-reset-admin', templateData);
      
      return await this.sendEmail({
        to: companyEmail,
        subject: 'Password Reset - Admin Account',
        html,
        emailType: 'password-reset',
        categories: ['admin', 'password-reset']
      });
    } catch (error) {
      // Fallback to basic template
      const html = `<html><body><h1>Password Reset</h1><p>Email: ${companyEmail}</p><p>New Password: ${tempPassword}</p></body></html>`;
      return await this.sendEmail({
        to: companyEmail,
        subject: 'Password Reset',
        html
      });
    }
  }

  async sendAccountStatusEmail(companyEmail, isActive, changedBy) {
    const status = isActive ? 'Activated' : 'Deactivated';
    const html = `<html><body><h1>Account ${status}</h1><p>Email: ${companyEmail}</p><p>Changed by: ${changedBy}</p></body></html>`;
    return await this.sendEmail({
      to: companyEmail,
      subject: `Account ${status}`,
      html
    });
  }

  async sendSubscriptionConfirmation(subscriberEmail, token) {
    try {
      const templateData = {
        subscriberEmail: subscriberEmail,
        confirmationToken: token,
        confirmationUrl: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/confirm-subscription?token=${token}&email=${encodeURIComponent(subscriberEmail)}`,
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('subscription-confirmation', templateData);
      
      return await this.sendEmail({
        to: subscriberEmail,
        subject: 'Please Confirm Your Subscription',
        html,
        emailType: 'subscription-confirmation',
        categories: ['subscription', 'confirmation']
      });
    } catch (error) {
      // Fallback to basic template
      const html = `<html><body><h1>Confirm Subscription</h1><p>Email: ${subscriberEmail}</p><p>Token: ${token}</p></body></html>`;
      return await this.sendEmail({
        to: subscriberEmail,
        subject: 'Confirm Subscription',
        html
      });
    }
  }

  // New auction-related email methods
  async sendAuctionRegistrationConfirmation(participantEmail, auctionDetails) {
    try {
      const templateData = {
        participantEmail: participantEmail,
        auctionTitle: auctionDetails.title,
        auctionDate: auctionDetails.date,
        auctionLocation: auctionDetails.location,
        registrationId: auctionDetails.registrationId,
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('auction-registration-confirmation', templateData);
      
      return await this.sendEmail({
        to: participantEmail,
        subject: `Auction Registration Confirmed - ${auctionDetails.title}`,
        html,
        emailType: 'auction-registration',
        categories: ['auction', 'registration', 'confirmation']
      });
    } catch (error) {
      console.warn('[WARNING] Auction registration email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendAuctionRegistrationApproved(participantEmail, auctionDetails) {
    try {
      const templateData = {
        participantEmail: participantEmail,
        auctionTitle: auctionDetails.title,
        auctionDate: auctionDetails.date,
        auctionLocation: auctionDetails.location,
        approvalDate: new Date().toLocaleDateString(),
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('auction-registration-approved', templateData);
      
      return await this.sendEmail({
        to: participantEmail,
        subject: `Auction Registration Approved - ${auctionDetails.title}`,
        html,
        emailType: 'auction-approved',
        categories: ['auction', 'registration', 'approved']
      });
    } catch (error) {
      console.warn('[WARNING] Auction approval email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendAuctionRegistrationRejected(participantEmail, auctionDetails, reason) {
    try {
      const templateData = {
        participantEmail: participantEmail,
        auctionTitle: auctionDetails.title,
        rejectionReason: reason,
        rejectionDate: new Date().toLocaleDateString(),
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('auction-registration-rejected', templateData);
      
      return await this.sendEmail({
        to: participantEmail,
        subject: `Auction Registration Update - ${auctionDetails.title}`,
        html,
        emailType: 'auction-rejected',
        categories: ['auction', 'registration', 'rejected']
      });
    } catch (error) {
      console.warn('[WARNING] Auction rejection email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmailToSubscriber(subscriberEmail, subscriptionData = {}) {
    try {
      const templateData = {
        subscriberEmail: subscriberEmail,
        subscriptionType: subscriptionData.subscriptionType || 'all',
        subscriberName: subscriptionData.name || 'Valued Subscriber',
        welcomeMessage: 'Welcome to Ishaazi Livestock Services!',
        unsubscribe_url: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`,
        manage_preferences_url: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/preferences?email=${encodeURIComponent(subscriberEmail)}`,
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('welcome-subscriber', templateData);
      
      return await this.sendEmail({
        to: subscriberEmail,
        subject: 'Welcome to Ishaazi Livestock Services!',
        html,
        emailType: 'welcome-subscriber',
        categories: ['welcome', 'subscriber', 'onboarding']
      });
    } catch (error) {
      console.warn('[WARNING] Welcome subscriber email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEventRegistrationConfirmation(participantEmail, eventDetails) {
    try {
      const templateData = {
        participantEmail: participantEmail,
        eventTitle: eventDetails.title || 'Event',
        eventDate: eventDetails.date || 'TBD',
        eventLocation: eventDetails.location || 'To be announced',
        registrationId: eventDetails.registrationId || 'N/A',
        eventDescription: eventDetails.description || '',
        supportEmail: this.config.replyTo
      };
      
      const html = this.renderTemplate('event-registration-confirmation', templateData);
      
      return await this.sendEmail({
        to: participantEmail,
        subject: `Event Registration Confirmed - ${eventDetails.title || 'Event'}`,
        html,
        emailType: 'event-registration',
        categories: ['event', 'registration', 'confirmation']
      });
    } catch (error) {
      console.warn('[WARNING] Event registration email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendNewsletter(subscribers, newsletterData) {
    const results = { sent: 0, failed: 0, errors: [] };
    
    // Add tracking and analytics
    const campaignId = `newsletter_${Date.now()}`;
    
    for (const subscriber of subscribers) {
      try {
        const templateData = {
          ...newsletterData,
          subscriberEmail: subscriber.email,
          subscriptionType: subscriber.subscriptionType,
          unsubscribe_url: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&campaign=${campaignId}`,
          manage_preferences_url: `${process.env.FRONTEND_URL || 'https://ishaazilivestockservices.com'}/preferences?email=${encodeURIComponent(subscriber.email)}`
        };
        
        const html = this.renderTemplate('newsletter', templateData);
        
        const result = await this.sendEmail({
          to: subscriber.email,
          subject: newsletterData.subject,
          html,
          campaignId,
          emailType: 'newsletter',
          categories: ['newsletter', newsletterData.category || 'general'],
          unsubscribeGroupId: 1, // Newsletter unsubscribe group
          userId: subscriber._id
        });
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ email: subscriber.email, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: subscriber.email, error: error.message });
      }
    }
    
    // Log campaign results
    console.log(`[NEWSLETTER] Campaign ${campaignId}: ${results.sent} sent, ${results.failed} failed`);
    
    return { ...results, campaignId };
  }

  async healthCheck() {
    return this.isInitialized ? 
      { status: 'healthy', provider: 'sendgrid' } : 
      { status: 'unhealthy', error: 'SendGrid not initialized' };
  }

  getStats() {
    return {
      provider: 'sendgrid',
      templatesLoaded: this.templates.size,
      templateNames: Array.from(this.templates.keys()),
      isConfigured: this.isInitialized
    };
  }

  getTemplates() {
    return {
      templates: Array.from(this.templates.keys()),
      count: this.templates.size,
      isLoaded: this.templates.size > 0
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export const sendEmail = (options) => emailService.sendEmail(options);
export const sendWelcomeEmailToSubscriber = (userEmail, subscriptionData) => emailService.sendWelcomeEmailToSubscriber(userEmail, subscriptionData);
export const sendWelcomeEmailToEditor = (email, pass, by) => emailService.sendWelcomeEmailToEditor(email, pass, by);
export const sendPasswordResetEmail = (email, pass, by) => emailService.sendPasswordResetEmail(email, pass, by);
export const sendAccountStatusEmail = (email, active, by) => emailService.sendAccountStatusEmail(email, active, by);
export const sendSubscriptionConfirmation = (email, token) => emailService.sendSubscriptionConfirmation(email, token);
export const sendNewsletter = (subscribers, data) => emailService.sendNewsletter(subscribers, data);
export const sendAuctionRegistrationConfirmation = (email, details) => emailService.sendAuctionRegistrationConfirmation(email, details);
export const sendAuctionRegistrationApproved = (email, details) => emailService.sendAuctionRegistrationApproved(email, details);
export const sendAuctionRegistrationRejected = (email, details, reason) => emailService.sendAuctionRegistrationRejected(email, details, reason);
export const sendEventRegistrationConfirmation = (email, details) => emailService.sendEventRegistrationConfirmation(email, details);
export const getStats = () => emailService.getStats();
export const getTemplates = () => emailService.getTemplates();
export const healthCheck = () => emailService.healthCheck();

export default EmailService;
