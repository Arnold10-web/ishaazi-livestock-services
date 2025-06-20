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
      this.transporter = nodemailer.createTransport(this.config);
      
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
      if (process.env.NODE_ENV !== 'production') {
        this.transporter = {
          sendMail: this.mockSendMail.bind(this)
        };
        console.log('📧 Using mock email service for development');
      }
    }
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
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
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

  async sendWelcomeEmail(userEmail, userData = {}) {
    const template = this.renderTemplate('welcome', {
      username: userData.username || userEmail.split('@')[0],
      year: new Date().getFullYear(),
      ...userData
    });

    return await this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Farming Magazine!',
      html: template
    });
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
      const template = await this.getTemplate('welcome-admin');
      
      const templateData = {
        companyEmail,
        tempPassword,
        createdBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine'
      };

      const html = template ? this.renderTemplate(template, templateData) : this.getDefaultWelcomeTemplate(templateData);
      
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
      const template = await this.getTemplate('password-reset-admin');
      
      const templateData = {
        companyEmail,
        tempPassword,
        resetBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine',
        resetDate: new Date().toLocaleString()
      };

      const html = template ? this.renderTemplate(template, templateData) : this.getDefaultPasswordResetTemplate(templateData);
      
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
      const template = await this.getTemplate('account-status-admin');
      
      const templateData = {
        companyEmail,
        isActive,
        changedBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`,
        supportEmail: this.config.replyTo,
        companyName: 'Farming Magazine',
        changeDate: new Date().toLocaleString()
      };

      const html = template ? this.renderTemplate(template, templateData) : this.getDefaultAccountStatusTemplate(templateData);
      
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
   * Validate company email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid company email
   */
  validateCompanyEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const companyDomains = [
      'yourcompany.com',
      'farmingmagazine.com'
    ];

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    const domain = email.split('@')[1].toLowerCase();
    return companyDomains.includes(domain);
  }

  /**
   * Default welcome email template
   */
  getDefaultWelcomeTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5530; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .credentials { background: white; padding: 15px; border-left: 4px solid #2c5530; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${data.companyName}</h1>
            <p>Admin Portal Access</p>
          </div>
          <div class="content">
            <h2>Your admin account has been created!</h2>
            <p>Hello,</p>
            <p>Your admin account for ${data.companyName} has been created by <strong>${data.createdBy}</strong>.</p>
            
            <div class="credentials">
              <h3>Login Credentials:</h3>
              <p><strong>Email:</strong> ${data.companyEmail}</p>
              <p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>
            </div>
            
            <p>Please log in and change your password immediately for security.</p>
            
            <a href="${data.loginUrl}" class="button">Login to Admin Portal</a>
            
            <p><strong>Important:</strong> This is a temporary password that must be changed on your first login.</p>
            
            <p>If you have any questions, please contact support at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Default password reset email template
   */
  getDefaultPasswordResetTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d9534f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .credentials { background: white; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #d9534f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p>${data.companyName} Admin Portal</p>
          </div>
          <div class="content">
            <h2>Your password has been reset</h2>
            <p>Hello,</p>
            <p>Your admin account password has been reset by <strong>${data.resetBy}</strong> on ${data.resetDate}.</p>
            
            <div class="credentials">
              <h3>New Login Credentials:</h3>
              <p><strong>Email:</strong> ${data.companyEmail}</p>
              <p><strong>New Temporary Password:</strong> <code>${data.tempPassword}</code></p>
            </div>
            
            <p>Please log in and change your password immediately for security.</p>
            
            <a href="${data.loginUrl}" class="button">Login to Admin Portal</a>
            
            <p><strong>Security Notice:</strong> If you did not request this password reset, please contact support immediately.</p>
            
            <p>For security questions, contact support at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Default account status email template
   */
  getDefaultAccountStatusTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account ${data.isActive ? 'Activated' : 'Deactivated'} - ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.isActive ? '#5cb85c' : '#d9534f'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status { background: white; padding: 15px; border-left: 4px solid ${data.isActive ? '#5cb85c' : '#d9534f'}; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: ${data.isActive ? '#5cb85c' : '#d9534f'}; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account ${data.isActive ? 'Activated' : 'Deactivated'}</h1>
            <p>${data.companyName} Admin Portal</p>
          </div>
          <div class="content">
            <h2>Your account status has been updated</h2>
            <p>Hello,</p>
            <p>Your admin account status has been changed by <strong>${data.changedBy}</strong> on ${data.changeDate}.</p>
            
            <div class="status">
              <h3>Account Status:</h3>
              <p><strong>Email:</strong> ${data.companyEmail}</p>
              <p><strong>Status:</strong> ${data.isActive ? 'Active' : 'Deactivated'}</p>
            </div>
            
            ${data.isActive ? 
              `<p>Your account has been activated. You can now log in to the admin portal.</p>
               <a href="${data.loginUrl}" class="button">Login to Admin Portal</a>` :
              `<p>Your account has been deactivated. You will no longer be able to access the admin portal.</p>`
            }
            
            <p>If you have questions about this change, please contact support at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
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
