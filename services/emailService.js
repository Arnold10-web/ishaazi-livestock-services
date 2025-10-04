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
      if (!this.apiKey) {
        console.warn('[WARNING] SendGrid API key not configured properly. Check your SENDGRID_API_KEY environment variable.');
        console.warn('[INFO] Email service will continue in degraded mode - emails will not be sent');
        this.isInitialized = false;
        return; // Non-blocking - server can continue
      }

      sgMail.setApiKey(this.apiKey);
      
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
    this.templates.set('newsletter', '<html><body>{{content}}</body></html>');
    this.templates.set('welcome-subscriber', '<html><body>Welcome {{subscriberEmail}}!</body></html>');
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
      replyTo: this.config.replyTo
    };

    try {
      const result = await sgMail.send(mailOptions);
      console.log('[SUCCESS] Email sent successfully via SendGrid');
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('[ERROR] Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmailToEditor(companyEmail, tempPassword, createdBy) {
    const html = `<html><body><h1>Welcome to Admin Portal</h1><p>Email: ${companyEmail}</p><p>Password: ${tempPassword}</p></body></html>`;
    return await this.sendEmail({
      to: companyEmail,
      subject: 'Welcome to Admin Portal',
      html
    });
  }

  async sendPasswordResetEmail(companyEmail, tempPassword, resetBy) {
    const html = `<html><body><h1>Password Reset</h1><p>Email: ${companyEmail}</p><p>New Password: ${tempPassword}</p></body></html>`;
    return await this.sendEmail({
      to: companyEmail,
      subject: 'Password Reset',
      html
    });
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
    const html = `<html><body><h1>Confirm Subscription</h1><p>Email: ${subscriberEmail}</p><p>Token: ${token}</p></body></html>`;
    return await this.sendEmail({
      to: subscriberEmail,
      subject: 'Confirm Subscription',
      html
    });
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
        if (result.success) results.sent++;
        else results.failed++;
      } catch (error) {
        results.failed++;
        results.errors.push({ email: subscriber.email, error: error.message });
      }
    }
    return results;
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
      isConfigured: this.isInitialized
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export const sendEmail = (options) => emailService.sendEmail(options);
export const sendWelcomeEmailToSubscriber = (userEmail) => emailService.sendWelcomeEmailToSubscriber(userEmail);
export const sendWelcomeEmailToEditor = (email, pass, by) => emailService.sendWelcomeEmailToEditor(email, pass, by);
export const sendPasswordResetEmail = (email, pass, by) => emailService.sendPasswordResetEmail(email, pass, by);
export const sendAccountStatusEmail = (email, active, by) => emailService.sendAccountStatusEmail(email, active, by);
export const sendSubscriptionConfirmation = (email, token) => emailService.sendSubscriptionConfirmation(email, token);
export const sendNewsletter = (subscribers, data) => emailService.sendNewsletter(subscribers, data);
export const getStats = () => emailService.getStats();
export const healthCheck = () => emailService.healthCheck();

export default EmailService;
