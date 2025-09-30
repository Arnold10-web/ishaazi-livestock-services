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
    const provider = process.env.EMAIL_SERVICE || 'smtp';
    
    console.log('[EMAIL] Email provider selected:', provider);
    console.log('[EMAIL] Environment variables check:', {
      EMAIL_HOST: process.env.EMAIL_HOST ? '[SET]' : '[NOT SET]',
      EMAIL_USER: process.env.EMAIL_USER ? '[SET]' : '[NOT SET]',
      EMAIL_SERVICE: process.env.EMAIL_SERVICE
    });
    
    const configs = {
      smtp: {
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'ishaazilivestockservices.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || true,
        requireTLS: false,
        tls: {
          rejectUnauthorized: false,
          servername: process.env.EMAIL_HOST || process.env.SMTP_HOST
        },
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

    const selectedConfig = configs[provider] || configs.smtp;

    return {
      provider,
      ...selectedConfig,
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Ishaazi Livestock Services',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'system@ishaazilivestockservices.com'
      },
      replyTo: process.env.EMAIL_REPLY_TO || 'info@ishaazilivestockservices.com'
    };
  }

  async initializeService() {
    try {
      // Check if email credentials are properly configured
      const hasValidCredentials = this.validateCredentials();
      
      if (!hasValidCredentials) {
        console.warn('[WARNING] Email credentials not configured properly. Check your environment variables.');
        this.transporter = {
          sendMail: this.mockSendMail.bind(this)
        };
        return;
      }

            // Create transporter with user's preferred configuration
      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection with configuration from August 3rd working version
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('[EMAIL] Attempting SMTP verification with working August 3rd configuration...');
          console.log('[EMAIL] Using configuration:', {
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            user: this.config.auth.user ? '[SET]' : '[NOT SET]',
            requireTLS: this.config.requireTLS
          });
          
          // Try verification like the working August 3rd version
          await this.transporter.verify();
          console.log('[SUCCESS] Email service verified successfully with August 3rd configuration');
        } catch (verifyError) {
          console.warn('[WARNING] SMTP verification failed in production:', verifyError.message);
          // Continue without verification as the August 3rd version would
          console.log('[EMAIL] Continuing with unverified transporter - emails may still work');
        }
      } else {
        console.log('[EMAIL] Email service initialized (development mode)');
        console.log('[EMAIL] Note: SMTP verification skipped for local development');
      }
      
      // Load email templates
      await this.loadTemplates();
    } catch (error) {
      console.error('[ERROR] Email service initialization failed:', error.message);
      // In production, this should be treated as a critical error
      if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL] Email service failure in production environment');
      }
      // Fall back to mock for development only
      this.transporter = {
        sendMail: this.mockSendMail.bind(this)
      };
      console.log('[EMAIL] Using mock email service as fallback');
    }
  }

  validateCredentials() {
    const user = this.config.auth?.user;
    const pass = this.config.auth?.pass;
    
    console.log('[DEBUG] Email config validation:', {
      user: user ? '[SET]' : '[NOT SET]',
      pass: pass ? '[SET]' : '[NOT SET]',
      host: this.config.host,
      port: this.config.port
    });
    
    // Check for placeholder values or missing credentials
    const placeholderValues = [
      'your_email_username',
      'your_email_password', 
      'info@companyemail.com',
      'your_smtp_host',
      'provided by namecheap'
    ];
    
    if (!user || !pass) {
      console.log('[ERROR] Missing email credentials');
      return false;
    }
    
    // Check if any credentials contain placeholder text
    const hasPlaceholders = placeholderValues.some(placeholder => 
      user.includes(placeholder) || pass.includes(placeholder)
    );
    
    if (hasPlaceholders) {
      console.log('[ERROR] Placeholder values detected in email credentials');
      return false;
    }
    
    console.log('[SUCCESS] Email credentials validation passed');
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
      console.log(`[TEMPLATES] Loaded ${this.templates.size} email templates`);
    } catch (error) {
      console.log('[TEMPLATES] No email templates directory found, using default templates');
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
              <p>© {{year}} Ishaazi Livestock Services. All rights reserved.</p>
              <p><a href="{{unsubscribeUrl}}" style="color: #666;">Unsubscribe</a></p>
            </div>
          </body>
        </html>
      `,
      'welcome-subscriber': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2d5a27 0%, #4a7c3a 100%); color: white; padding: 40px 30px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 15px;">&#127806;</div>
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
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async sendEmail(options) {
    // Debug logging
    console.log('[DEBUG] sendEmail called with options:', {
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
      optionsKeys: Object.keys(options)
    });
    
    // Validate required fields
    if (!options.to) {
      const error = new Error('No recipients defined - "to" field is required');
      console.error('[ERROR]', error.message);
      throw error;
    }
    
    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      replyTo: this.config.replyTo,
      ...options
    };

    console.log('[DEBUG] Final mailOptions:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html
    });

    try {
      // Add timeout to email sending
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 180000) // 3 minutes
      );
      
      const result = await Promise.race([
        this.transporter.sendMail(mailOptions),
        timeoutPromise
      ]);
      
      console.log('[SUCCESS] Email sent successfully:', result.messageId);
      
      // Update subscriber success info if email is provided
      if (options.to && typeof options.to === 'string') {
        await emailErrorHandler.updateSubscriberSuccess(options.to);
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[ERROR] Email sending failed:', error.message);
      
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

// Create singleton instance with protection against multiple initialization
let emailService = null;

const getEmailService = () => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};

// Get the singleton instance
emailService = getEmailService();

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
