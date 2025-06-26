/**
 * Email Service
 * 
 * A comprehensive service for handling all email-related operations in the application.
 * This service supports multiple email providers (SMTP, Gmail, SendGrid), template
 * management, email queuing, rate limiting, and tracking capabilities.
 * 
 * Features:
 * - Dynamic template loading and rendering
 * - Email delivery with attachments
 * - Templated emails with variable substitution
 * - Batched sending for newsletters
 * - Email open and click tracking
 * - Configurable retry mechanism
 * - Multiple provider support with fallback
 * 
 * @module services/emailService
 */
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailErrorHandler from './emailErrorHandler.js';

// Create __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * EmailService class for handling all email functionality
 */
class EmailService {
  /**
   * Creates a new EmailService instance
   * Initializes the email transporter with configuration from environment variables
   * and loads email templates from the filesystem
   */
  constructor() {
    this.transporter = null;
    this.config = this.getEmailConfig();
    this.templates = new Map();
    this.initializeService();
  }

  getEmailConfig() {
    const provider = process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || 'smtp';
    
    const configs = {
      smtp: {
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        }
      },
      gmail: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      },
      sendgrid: {
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      }
    };

    const selectedConfig = configs[provider] || configs.gmail;

    return {
      provider,
      ...selectedConfig,
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Farming Magazine',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@farmingmagazine.com'
      },
      replyTo: process.env.EMAIL_REPLY_TO || 'contact@farmingmagazine.com'
    };
  }

  async initializeService() {
    try {
      // Check if email credentials are properly configured
      const hasValidCredentials = this.validateCredentials();
      
      if (!hasValidCredentials) {
        console.log('📧 Email credentials not configured. Running without email service...');
        this.transporter = {
          sendMail: this.mockSendMail.bind(this)
        };
        return;
      }

      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify the connection in production
      if (process.env.NODE_ENV === 'production') {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      } else {
        console.log('📧 Email service initialized (development mode)');
      }
      
      // Load email templates
      await this.loadTemplates();
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Fall back to console logging in development
      this.transporter = {
        sendMail: this.mockSendMail.bind(this)
      };
      console.log('📧 Using mock email service for development');
    }
  }

  validateCredentials() {
    const user = this.config.auth?.user;
    const pass = this.config.auth?.pass;
    
    // Check for placeholder values or missing credentials
    const placeholderValues = [
      'your_email_username',
      'your_email_password', 
      'info@companyemail.com',
      'your_smtp_host',
      'provided by namecheap'
    ];
    
    if (!user || !pass) {
      return false;
    }
    
    // Check if any credentials contain placeholder text
    const hasPlaceholders = placeholderValues.some(placeholder => 
      user.includes(placeholder) || pass.includes(placeholder)
    );
    
    return !hasPlaceholders;
  }

  async loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    try {
      const files = await fs.readdir(templatesDir);
      for (const file of files) {
        if (file.endsWith('.html')) {
          const templateName = file.replace('.html', '');
          const templateContent = await fs.readFile(
            path.join(templatesDir, file), 
            'utf-8'
          );
          this.templates.set(templateName, templateContent);
        }
      }
      console.log(`📄 Loaded ${this.templates.size} email templates`);
    } catch (error) {
      console.log('📄 No email templates directory found, using default templates');
      this.loadDefaultTemplates();
    }
  }

  loadDefaultTemplates() {
    const defaultTemplates = {
      newsletter: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
              <h1>{{title}}</h1>
            </div>
            <div style="padding: 20px;">
              {{content}}
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>© {{year}} Farming Magazine. All rights reserved.</p>
              <p><a href="{{unsubscribeUrl}}" style="color: #666;">Unsubscribe</a></p>
            </div>
          </body>
        </html>
      `,
      'welcome-subscriber': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2d5a27 0%, #4a7c3a 100%); color: white; padding: 40px 30px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 15px;">🌾</div>
              <h1 style="font-size: 28px; margin-bottom: 10px;">Welcome to {{companyName}}!</h1>
              <p>Your gateway to modern farming knowledge</p>
            </div>
            <div style="padding: 40px 30px; background: white;">
              <div style="background: linear-gradient(135deg, #f8fdf6 0%, #e8f5e8 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #2d5a27; margin: 20px 0;">
                <h2 style="color: #2d5a27; margin-bottom: 15px;">Thank you for subscribing!</h2>
                <p>Welcome to our community of passionate farmers and agricultural enthusiasts. We're thrilled to have you join us!</p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d5a27;">Your Subscription Details</h3>
                <p><strong>Email:</strong> {{subscriberEmail}}</p>
                <p><strong>Subscription Type:</strong> {{subscriptionType}}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{websiteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #2d5a27 0%, #4a7c3a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit Our Website</a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
              <p><strong>{{companyName}}</strong></p>
              <p>{{contactEmail}}</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <a href="{{unsubscribeUrl}}" style="color: #999; text-decoration: none; font-size: 12px;">Unsubscribe</a>
              </div>
            </div>
          </body>
        </html>
      `,
      'subscription-confirmation': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%); color: white; padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">📧</div>
              <h1>Confirm Your Subscription</h1>
              <p>One more step to complete your subscription</p>
            </div>
            <div style="padding: 40px 30px; background: white;">
              <div style="background: linear-gradient(135deg, #fff8f0 0%, #fef5e7 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #e67e22; margin: 20px 0; text-align: center;">
                <h2 style="color: #e67e22; margin-bottom: 15px;">🎉 Thanks for subscribing!</h2>
                <p>Please confirm your email address to complete your subscription.</p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p><strong>Please confirm this email address:</strong></p>
                <div style="font-size: 18px; font-weight: bold; color: #2d5a27; background: white; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 10px 0;">{{subscriberEmail}}</div>
              </div>
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{confirmationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">✓ Confirm My Subscription</a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
              <p><strong>{{companyName}}</strong></p>
              <p>If you didn't request this subscription, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
      welcome: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
              <h1>Welcome to Farming Magazine!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hello {{username}},</p>
              <p>Thank you for joining our farming community! We're excited to have you aboard.</p>
              <p>You'll receive the latest farming news, tips, and insights directly to your inbox.</p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>© {{year}} Farming Magazine. All rights reserved.</p>
            </div>
          </body>
        </html>
      `
    };

    Object.entries(defaultTemplates).forEach(([name, template]) => {
      this.templates.set(name, template);
    });
  }

  renderTemplate(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    // Simple template rendering (replace {{variable}} with data.variable)
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async sendEmail(options) {
    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      replyTo: this.config.replyTo,
      ...options
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      
      // Update subscriber success info if email is provided
      if (options.to && typeof options.to === 'string') {
        await emailErrorHandler.updateSubscriberSuccess(options.to);
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Handle email failure if subscriber email is provided
      if (options.to && typeof options.to === 'string') {
        await emailErrorHandler.handleEmailFailure(
          {
            subject: options.subject,
            html: options.html,
            text: options.text,
            type: options.emailType || 'unknown',
            error: error
          },
          error,
          options.to
        );
      }
      
      return { success: false, error: error.message };
    }
  }

  async sendNewsletter(subscribers, newsletterData) {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    const template = this.renderTemplate('newsletter', {
      ...newsletterData,
      year: new Date().getFullYear(),
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token={{unsubscribeToken}}`
    });

    // Send in small batches to avoid rate limiting
    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE) || 5;
    const delay = parseInt(process.env.EMAIL_BATCH_DELAY) || 2000;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      for (const subscriber of batch) {
        try {
          const personalizedTemplate = template.replace(
            '{{unsubscribeToken}}', 
            subscriber.unsubscribeToken || 'no-token'
          );

          const result = await this.sendEmail({
            to: subscriber.email,
            subject: newsletterData.subject,
            html: personalizedTemplate
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push({
              email: subscriber.email,
              error: result.error
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            email: subscriber.email,
            error: error.message
          });
        }
      }

      // Add delay between batches
      if (i + batchSize < subscribers.length) {
        console.log(`⏳ Waiting ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * Send welcome email to new subscriber
   * @param {string} subscriberEmail - Subscriber's email address
   * @param {Object} subscriberData - Subscriber information
   * @returns {Promise<Object>} Email send result
   */
  async sendWelcomeEmail(subscriberEmail, subscriberData = {}) {
    try {
      const subject = `Welcome to ${process.env.EMAIL_FROM_NAME || 'Farming Magazine'} - You're All Set!`;
      
      // Get template data
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Farming Magazine',
        subscriberEmail,
        subscriptionType: subscriberData.subscriptionType || 'all',
        frequency: this.getSubscriptionFrequency(subscriberData.subscriptionType),
        websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        contactEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        contactPhone: process.env.CONTACT_PHONE || '(555) 123-4567',
        companyAddress: process.env.COMPANY_ADDRESS || '123 Farm Street, Agriculture City, AC 12345',
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`,
        preferencesUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/preferences?email=${encodeURIComponent(subscriberEmail)}`,
        facebookUrl: process.env.FACEBOOK_URL || '#',
        twitterUrl: process.env.TWITTER_URL || '#',
        linkedinUrl: process.env.LINKEDIN_URL || '#',
        instagramUrl: process.env.INSTAGRAM_URL || '#',
        year: new Date().getFullYear()
      };

      // Use welcome-subscriber template
      const template = this.templates.get('welcome-subscriber');
      const html = template ? this.renderTemplate('welcome-subscriber', templateData) : this.getDefaultWelcomeSubscriberTemplate(templateData);
      
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Farming Magazine'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: subscriberEmail,
        subject,
        html,
        replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Welcome email sent to new subscriber: ${subscriberEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: subscriberEmail
      };

    } catch (error) {
      console.error('Failed to send welcome email to subscriber:', error);
      return {
        success: false,
        error: error.message,
        recipient: subscriberEmail
      };
    }
  }

  /**
   * Send welcome email to new editor user
   * @param {string} companyEmail - Company email address
   * @param {string} tempPassword - Temporary password
   * @param {string} createdBy - Admin who created the account
   * @returns {Promise<Object>} Email send result
   */
  async sendWelcomeEmail(companyEmail, tempPassword, createdBy) {
    try {
      const subject = 'Welcome to Farming Magazine Admin Portal';
      const template = this.templates.get('welcome-admin');
      
      const templateData = {
        companyEmail,
        tempPassword,
        createdBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine'
      };

      const html = template ? this.renderTemplate('welcome-admin', templateData) : this.getDefaultWelcomeTemplate(templateData);
      
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: companyEmail,
        subject,
        html,
        replyTo: this.config.replyTo
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Welcome email sent to ${companyEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: companyEmail
      };

    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Send password reset email to company email
   * @param {string} companyEmail - Company email address
   * @param {string} tempPassword - New temporary password
   * @param {string} resetBy - Admin who reset the password
   * @returns {Promise<Object>} Email send result
   */
  async sendPasswordResetEmail(companyEmail, tempPassword, resetBy) {
    try {
      const subject = 'Admin Account Password Reset - Farming Magazine';
      const template = this.templates.get('password-reset-admin');
      
      const templateData = {
        companyEmail,
        tempPassword,
        resetBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine',
        resetDate: new Date().toLocaleString()
      };

      const html = template ? this.renderTemplate('password-reset-admin', templateData) : this.getDefaultPasswordResetTemplate(templateData);
      
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: companyEmail,
        subject,
        html,
        replyTo: this.config.replyTo,
        priority: 'high'
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Password reset email sent to ${companyEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: companyEmail
      };

    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Send account status change notification
   * @param {string} companyEmail - Company email address
   * @param {boolean} isActive - New account status
   * @param {string} changedBy - Admin who changed the status
   * @returns {Promise<Object>} Email send result
   */
  async sendAccountStatusEmail(companyEmail, isActive, changedBy) {
    try {
      const subject = `Admin Account ${isActive ? 'Activated' : 'Deactivated'} - Farming Magazine`;
      const template = this.templates.get('account-status-admin');
      
      const templateData = {
        companyEmail,
        isActive,
        changedBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine',
        changeDate: new Date().toLocaleString()
      };

      const html = template ? this.renderTemplate('account-status-admin', templateData) : this.getDefaultAccountStatusTemplate(templateData);
      
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: companyEmail,
        subject,
        html,
        replyTo: this.config.replyTo
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Account status email sent to ${companyEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: companyEmail
      };

    } catch (error) {
      console.error('Failed to send account status email:', error);
      throw new Error(`Failed to send account status email: ${error.message}`);
    }
  }

  /**
   * Send subscription confirmation email (double opt-in)
   * @param {string} subscriberEmail - Subscriber's email address  
   * @param {string} confirmationToken - Unique confirmation token
   * @param {Object} subscriberData - Subscriber information
   * @returns {Promise<Object>} Email send result
   */
  async sendSubscriptionConfirmation(subscriberEmail, confirmationToken, subscriberData = {}) {
    try {
      const subject = `Please Confirm Your Subscription to ${process.env.EMAIL_FROM_NAME || 'Farming Magazine'}`;
      
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Farming Magazine',
        subscriberEmail,
        subscriptionType: subscriberData.subscriptionType || 'all',
        confirmationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-subscription?token=${confirmationToken}&email=${encodeURIComponent(subscriberEmail)}`,
        contactEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        supportEmail: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
        companyAddress: process.env.COMPANY_ADDRESS || '123 Farm Street, Agriculture City, AC 12345',
        contactPhone: process.env.CONTACT_PHONE || '(555) 123-4567',
        year: new Date().getFullYear()
      };

      const template = this.templates.get('subscription-confirmation');
      const html = template ? this.renderTemplate('subscription-confirmation', templateData) : this.getDefaultConfirmationTemplate(templateData);
      
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Farming Magazine'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: subscriberEmail,
        subject,
        html,
        replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Confirmation email sent to: ${subscriberEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: subscriberEmail
      };

    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return {
        success: false,
        error: error.message,
        recipient: subscriberEmail
      };
    }
  }

  /**
   * Get subscription frequency text based on type
   * @param {string} subscriptionType - Type of subscription
   * @returns {string} Frequency description
   */
  getSubscriptionFrequency(subscriptionType) {
    const frequencies = {
      'all': 'weekly',
      'newsletters': 'weekly', 
      'events': 'as announced',
      'auctions': 'as scheduled',
      'farming-tips': 'twice weekly',
      'livestock-updates': 'weekly'
    };
    return frequencies[subscriptionType] || 'regular';
  }

  /**
   * Default welcome subscriber template
   */
  getDefaultWelcomeSubscriberTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2d5a27 0%, #4a7c3a 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .welcome-box { background: linear-gradient(135deg, #f8fdf6 0%, #e8f5e8 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #2d5a27; margin: 20px 0; }
          .details-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #2d5a27 0%, #4a7c3a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 36px; margin-bottom: 15px;">🌾</div>
            <h1>Welcome to ${data.companyName}!</h1>
            <p>Your gateway to modern farming knowledge</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2 style="color: #2d5a27; margin-bottom: 15px;">Thank you for subscribing!</h2>
              <p>Welcome to our community of passionate farmers and agricultural enthusiasts. We're thrilled to have you join us!</p>
            </div>
            <div class="details-box">
              <h3 style="color: #2d5a27;">📧 Your Subscription Details</h3>
              <p><strong>Email:</strong> ${data.subscriberEmail}</p>
              <p><strong>Subscription Type:</strong> ${data.subscriptionType}</p>
              <p><strong>Frequency:</strong> ${data.frequency} updates</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.websiteUrl}" class="button">Visit Our Website</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>${data.companyName}</strong></p>
            <p>${data.contactEmail}</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <a href="${data.unsubscribeUrl}" style="color: #999; text-decoration: none; font-size: 12px;">Unsubscribe</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Default confirmation email template
   */
  getDefaultConfirmationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirm Your Subscription</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .confirmation-box { background: linear-gradient(135deg, #fff8f0 0%, #fef5e7 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #e67e22; margin: 20px 0; text-align: center; }
          .email-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 48px; margin-bottom: 15px;">📧</div>
            <h1>Confirm Your Subscription</h1>
            <p>One more step to complete your subscription</p>
          </div>
          <div class="content">
            <div class="confirmation-box">
              <h2 style="color: #e67e22; margin-bottom: 15px;">🎉 Thanks for subscribing!</h2>
              <p>Please confirm your email address to complete your subscription.</p>
            </div>
            <div class="email-box">
              <p><strong>Please confirm this email address:</strong></p>
              <div style="font-size: 18px; font-weight: bold; color: #2d5a27; background: white; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 10px 0;">${data.subscriberEmail}</div>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.confirmationUrl}" class="button">✓ Confirm My Subscription</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>${data.companyName}</strong></p>
            <p>If you didn't request this subscription, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Mock email sending for development/testing
  mockSendMail(options) {
    console.log('📧 Mock Email Sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('From:', options.from);
    return Promise.resolve({ messageId: 'mock-' + Date.now() });
  }

  // Health check for email service
  async healthCheck() {
    try {
      if (this.transporter && typeof this.transporter.verify === 'function') {
        await this.transporter.verify();
        return { status: 'healthy', provider: this.config.provider };
      }
      return { status: 'mock', provider: 'development' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get email service statistics
  getStats() {
    return {
      provider: this.config.provider,
      templatesLoaded: this.templates.size,
      isConfigured: !!this.transporter
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export individual functions for backward compatibility
export const sendNewsletter = (subscribers, newsletterData) => {
  return emailService.sendNewsletter(subscribers, newsletterData);
};

export const sendWelcomeEmail = (userEmail, userData = {}) => {
  return emailService.sendWelcomeEmail(userEmail, userData);
};

export const sendSubscriptionConfirmation = (subscriberEmail, confirmationToken, subscriberData = {}) => {
  return emailService.sendSubscriptionConfirmation(subscriberEmail, confirmationToken, subscriberData);
};

// Export new company email functions
export const sendWelcomeEmailToEditor = (companyEmail, tempPassword, createdBy) => {
  return emailService.sendWelcomeEmail(companyEmail, tempPassword, createdBy);
};

export const sendPasswordResetEmail = (companyEmail, tempPassword, resetBy) => {
  return emailService.sendPasswordResetEmail(companyEmail, tempPassword, resetBy);
};

export const sendAccountStatusEmail = (companyEmail, isActive, changedBy) => {
  return emailService.sendAccountStatusEmail(companyEmail, isActive, changedBy);
};

export const validateCompanyEmail = (email) => {
  return emailService.validateCompanyEmail(email);
};

// Generic send email function
export const sendEmail = (to, subject, html, options = {}) => {
  return emailService.sendEmail(to, subject, html, options);
};

// Export the class as default
export default EmailService;
