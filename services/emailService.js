/**
 * Email Service - Namecheap SMTP Only
 */
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailErrorHandler from './emailErrorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = this.getEmailConfig();
    this.templates = new Map();
    this.initializeService();
  }

  getEmailConfig() {
    console.log('[EMAIL] Initializing Namecheap SMTP configuration');
    
    return {
      provider: 'namecheap-smtp',
      host: process.env.EMAIL_HOST || 'mail.ishaazilivestockservices.com',
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'system@ishaazilivestockservices.com',
        pass: process.env.EMAIL_PASS
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'system@ishaazilivestockservices.com'
      },
      replyTo: process.env.EMAIL_REPLY_TO || 'info@ishaazilivestockservices.com'
    };
  }

  async initializeService() {
    try {
      console.log('[EMAIL] Starting email service initialization...');
      
      if (!this.validateCredentials()) {
        console.warn('[WARNING] Email credentials not properly configured');
        this.transporter = { sendMail: this.mockSendMail.bind(this) };
        return;
      }

      this.transporter = nodemailer.createTransport(this.config);
      console.log('[EMAIL] Transporter created with Namecheap SMTP');
      
      if (process.env.NODE_ENV !== 'production') {
        try {
          await this.transporter.verify();
          console.log('[SUCCESS] Email service verified successfully');
        } catch (verifyError) {
          console.warn('[WARNING] Email verification failed:', verifyError.message);
        }
      }
      
      await this.loadDefaultTemplates();
      console.log('[SUCCESS] Email service initialization complete');
      
    } catch (error) {
      console.error('[ERROR] Email service initialization failed:', error.message);
      this.transporter = { sendMail: this.mockSendMail.bind(this) };
    }
  }

  validateCredentials() {
    const user = this.config.auth?.user;
    const pass = this.config.auth?.pass;
    
    if (!user || !pass) {
      return false;
    }
    
    const placeholders = ['your_email_username', 'your_email_password'];
    return !placeholders.some(placeholder => 
      user.includes(placeholder) || pass.includes(placeholder)
    );
  }

  async loadDefaultTemplates() {
    const templates = {
      'welcome-subscriber': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2d5a27; color: white; padding: 40px 20px; text-align: center;">
              <h1>Welcome to {{companyName}}!</h1>
            </div>
            <div style="padding: 40px 20px;">
              <h2>Thank you for subscribing!</h2>
              <p>Email: {{subscriberEmail}}</p>
              <p>Type: {{subscriptionType}}</p>
            </div>
          </body>
        </html>
      `,
      newsletter: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
              <h1>{{title}}</h1>
            </div>
            <div style="padding: 20px;">
              {{content}}
            </div>
          </body>
        </html>
      `,
      'welcome-admin': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2d5a27; color: white; padding: 40px 20px; text-align: center;">
              <h1>Welcome to {{companyName}} Admin Portal</h1>
            </div>
            <div style="padding: 40px 20px;">
              <h2>Your admin account has been created</h2>
              <p><strong>Email:</strong> {{companyEmail}}</p>
              <p><strong>Temporary Password:</strong> {{tempPassword}}</p>
              <p><strong>Created by:</strong> {{createdBy}}</p>
              <p><a href="{{loginUrl}}" style="background: #2d5a27; color: white; padding: 10px 20px; text-decoration: none;">Login Now</a></p>
            </div>
          </body>
        </html>
      `,
      'password-reset-admin': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #e74c3c; color: white; padding: 40px 20px; text-align: center;">
              <h1>Password Reset - {{companyName}}</h1>
            </div>
            <div style="padding: 40px 20px;">
              <h2>Your password has been reset</h2>
              <p><strong>Email:</strong> {{companyEmail}}</p>
              <p><strong>New Temporary Password:</strong> {{tempPassword}}</p>
              <p><strong>Reset by:</strong> {{resetBy}}</p>
              <p><strong>Reset Date:</strong> {{resetDate}}</p>
              <p><a href="{{loginUrl}}" style="background: #2d5a27; color: white; padding: 10px 20px; text-decoration: none;">Login Now</a></p>
            </div>
          </body>
        </html>
      `,
      'account-status-admin': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {{statusColor}}; color: white; padding: 40px 20px; text-align: center;">
              <h1>Account {{statusText}}</h1>
            </div>
            <div style="padding: 40px 20px;">
              <h2>Your account status has been changed</h2>
              <p><strong>Email:</strong> {{companyEmail}}</p>
              <p><strong>Status:</strong> {{statusText}}</p>
              <p><strong>Changed by:</strong> {{changedBy}}</p>
              <p><strong>Change Date:</strong> {{changeDate}}</p>
            </div>
          </body>
        </html>
      `
    };

    Object.entries(templates).forEach(([name, template]) => {
      this.templates.set(name, template);
    });
    console.log(`[TEMPLATES] Loaded ${this.templates.size} templates`);
  }

  renderTemplate(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async sendEmail(options) {
    if (!options.to) {
      throw new Error('No recipients defined');
    }
    
    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      replyTo: this.config.replyTo,
      ...options
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('[SUCCESS] Email sent:', result.messageId);
      
      if (options.to && typeof options.to === 'string') {
        await emailErrorHandler.updateSubscriberSuccess(options.to);
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[ERROR] Email sending failed:', error.message);
      
      if (options.to && typeof options.to === 'string') {
        await emailErrorHandler.handleEmailFailure(
          {
            subject: options.subject,
            html: options.html,
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

  async sendWelcomeEmailToSubscriber(subscriberEmail, subscriberData = {}) {
    try {
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        subscriberEmail,
        subscriptionType: subscriberData.subscriptionType || 'all'
      };

      const html = this.renderTemplate('welcome-subscriber', templateData);
      
      return await this.sendEmail({
        to: subscriberEmail,
        subject: `Welcome to ${templateData.companyName}!`,
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message, recipient: subscriberEmail };
    }
  }

  async sendNewsletter(subscribers, newsletterData) {
    const results = { sent: 0, failed: 0, errors: [] };

    for (const subscriber of subscribers) {
      try {
        const html = this.renderTemplate('newsletter', newsletterData);
        const result = await this.sendEmail({
          to: subscriber.email,
          subject: newsletterData.subject,
          html
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

    return results;
  }

  async sendWelcomeEmailToEditor(companyEmail, tempPassword, createdBy) {
    try {
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        companyEmail,
        tempPassword,
        createdBy,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`
      };

      const html = this.renderTemplate('welcome-admin', templateData);
      
      return await this.sendEmail({
        to: companyEmail,
        subject: `Welcome to ${templateData.companyName} Admin Portal`,
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email to editor:', error);
      return { success: false, error: error.message, recipient: companyEmail };
    }
  }

  async sendPasswordResetEmail(companyEmail, tempPassword, resetBy) {
    try {
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        companyEmail,
        tempPassword,
        resetBy,
        resetDate: new Date().toLocaleString(),
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`
      };

      const html = this.renderTemplate('password-reset-admin', templateData);
      
      return await this.sendEmail({
        to: companyEmail,
        subject: `Password Reset - ${templateData.companyName}`,
        html
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message, recipient: companyEmail };
    }
  }

  async sendAccountStatusEmail(companyEmail, isActive, changedBy) {
    try {
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        companyEmail,
        isActive,
        changedBy,
        changeDate: new Date().toLocaleString(),
        statusText: isActive ? 'Activated' : 'Deactivated',
        statusColor: isActive ? '#27ae60' : '#e74c3c'
      };

      const html = this.renderTemplate('account-status-admin', templateData);
      
      return await this.sendEmail({
        to: companyEmail,
        subject: `Account ${isActive ? 'Activated' : 'Deactivated'} - ${templateData.companyName}`,
        html
      });
    } catch (error) {
      console.error('Failed to send account status email:', error);
      return { success: false, error: error.message, recipient: companyEmail };
    }
  }

  async sendSubscriptionConfirmation(subscriberEmail, confirmationToken, subscriberData = {}) {
    try {
      const templateData = {
        companyName: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        subscriberEmail,
        confirmationToken,
        confirmationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-subscription?token=${confirmationToken}&email=${encodeURIComponent(subscriberEmail)}`
      };

      // Simple confirmation template
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #e67e22; color: white; padding: 40px 20px; text-align: center;">
              <h1>Confirm Your Subscription</h1>
            </div>
            <div style="padding: 40px 20px;">
              <h2>Please confirm your email address</h2>
              <p>Email: ${subscriberEmail}</p>
              <p><a href="${templateData.confirmationUrl}" style="background: #2d5a27; color: white; padding: 10px 20px; text-decoration: none;">Confirm Subscription</a></p>
            </div>
          </body>
        </html>
      `;
      
      return await this.sendEmail({
        to: subscriberEmail,
        subject: `Please confirm your subscription to ${templateData.companyName}`,
        html
      });
    } catch (error) {
      console.error('Failed to send subscription confirmation:', error);
      return { success: false, error: error.message, recipient: subscriberEmail };
    }
  }

  mockSendMail(options) {
    console.log('[MOCK EMAIL] To:', options.to);
    console.log('[MOCK EMAIL] Subject:', options.subject);
    return Promise.resolve({ 
      messageId: `mock-${Date.now()}`,
      accepted: [options.to],
      rejected: []
    });
  }

  async healthCheck() {
    try {
      if (this.transporter.sendMail === this.mockSendMail) {
        return { status: 'mock', provider: 'development' };
      }
      
      if (typeof this.transporter.verify === 'function') {
        await this.transporter.verify();
        return { status: 'healthy', provider: this.config.provider };
      }
      
      return { status: 'configured', provider: this.config.provider };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

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

// Export functions
export const sendWelcomeEmailToSubscriber = (userEmail, userData = {}) => {
  return emailService.sendWelcomeEmailToSubscriber(userEmail, userData);
};

export const sendNewsletter = (subscribers, newsletterData) => {
  return emailService.sendNewsletter(subscribers, newsletterData);
};

export const sendWelcomeEmailToEditor = (companyEmail, tempPassword, createdBy) => {
  return emailService.sendWelcomeEmailToEditor(companyEmail, tempPassword, createdBy);
};

export const sendPasswordResetEmail = (companyEmail, tempPassword, resetBy) => {
  return emailService.sendPasswordResetEmail(companyEmail, tempPassword, resetBy);
};

export const sendAccountStatusEmail = (companyEmail, isActive, changedBy) => {
  return emailService.sendAccountStatusEmail(companyEmail, isActive, changedBy);
};

export const sendSubscriptionConfirmation = (subscriberEmail, confirmationToken, subscriberData = {}) => {
  return emailService.sendSubscriptionConfirmation(subscriberEmail, confirmationToken, subscriberData);
};

export const sendEmail = function(options, subject, html, additionalOptions) {
  if (typeof options === 'string') {
    return emailService.sendEmail({ 
      to: options, 
      subject, 
      html, 
      ...(additionalOptions || {}) 
    });
  } else {
    return emailService.sendEmail(options);
  }
};

export const getStats = () => emailService.getStats();
export const healthCheck = () => emailService.healthCheck();

export default EmailService;
