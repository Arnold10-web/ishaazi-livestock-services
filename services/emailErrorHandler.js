/**
 * Email Bounce and Error Handling Service
 * 
 * This service handles email bounces, delivery failures, and provides
 * retry mechanisms for failed email deliveries.
 */

import Subscriber from '../models/Subscriber.js';
import Newsletter from '../models/Newsletter.js';
import logger from '../utils/logger.js';

class EmailErrorHandler {
  constructor() {
    this.maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY) || 5000;
    this.failedEmails = new Map(); // In-memory storage for retry tracking
  }

  /**
   * Handle email delivery failure
   * @param {Object} emailData - Email data that failed
   * @param {Error} error - The error that occurred
   * @param {string} subscriberEmail - Subscriber's email address
   */
  async handleEmailFailure(emailData, error, subscriberEmail) {
    try {
      const errorType = this.categorizeError(error);
      
      logger.error('Email delivery failed', {
        subscriberEmail,
        errorType,
        error: error.message,
        emailData: {
          subject: emailData.subject,
          type: emailData.type || 'unknown'
        }
      });

      // Update subscriber with failure info
      await this.updateSubscriberFailure(subscriberEmail, errorType);

      // Determine if retry is appropriate
      if (this.shouldRetry(errorType, subscriberEmail)) {
        await this.scheduleRetry(emailData, subscriberEmail);
      } else {
        await this.handlePermanentFailure(subscriberEmail, errorType);
      }

      return {
        handled: true,
        retryScheduled: this.shouldRetry(errorType, subscriberEmail),
        errorType
      };
    } catch (handlingError) {
      logger.error('Error handling email failure', {
        subscriberEmail,
        originalError: error.message,
        handlingError: handlingError.message
      });
      return { handled: false, error: handlingError.message };
    }
  }

  /**
   * Categorize email error types
   * @param {Error} error - The error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('invalid email') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('user unknown') ||
        errorMessage.includes('no such user')) {
      return 'invalid_email';
    }
    
    if (errorMessage.includes('mailbox full') || 
        errorMessage.includes('quota exceeded')) {
      return 'mailbox_full';
    }
    
    if (errorMessage.includes('spam') || 
        errorMessage.includes('blocked') ||
        errorMessage.includes('reputation')) {
      return 'spam_block';
    }
    
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many')) {
      return 'rate_limit';
    }
    
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('connection')) {
      return 'connection_issue';
    }
    
    if (errorMessage.includes('authentication') || 
        errorMessage.includes('credentials')) {
      return 'auth_issue';
    }
    
    return 'unknown_error';
  }

  /**
   * Determine if email should be retried
   * @param {string} errorType - Type of error
   * @param {string} subscriberEmail - Subscriber's email
   * @returns {boolean} Whether to retry
   */
  shouldRetry(errorType, subscriberEmail) {
    // Don't retry these permanent failures
    const permanentErrors = ['invalid_email', 'spam_block'];
    if (permanentErrors.includes(errorType)) {
      return false;
    }

    // Check retry count
    const retryKey = `${subscriberEmail}_${errorType}`;
    const retryCount = this.failedEmails.get(retryKey) || 0;
    
    return retryCount < this.maxRetries;
  }

  /**
   * Schedule email retry
   * @param {Object} emailData - Original email data
   * @param {string} subscriberEmail - Subscriber's email
   */
  async scheduleRetry(emailData, subscriberEmail) {
    const retryKey = `${subscriberEmail}_${this.categorizeError(emailData.error)}`;
    const retryCount = (this.failedEmails.get(retryKey) || 0) + 1;
    
    this.failedEmails.set(retryKey, retryCount);
    
    // Calculate backoff delay (exponential backoff)
    const delay = this.retryDelay * Math.pow(2, retryCount - 1);
    
    logger.info('Scheduling email retry', {
      subscriberEmail,
      retryCount,
      delayMs: delay
    });

    // Schedule retry (in a real production system, you'd use a job queue like Bull/Agenda)
    setTimeout(async () => {
      try {
        await this.retryEmail(emailData, subscriberEmail);
      } catch (retryError) {
        logger.error('Email retry failed', {
          subscriberEmail,
          retryCount,
          error: retryError.message
        });
      }
    }, delay);
  }

  /**
   * Retry sending email
   * @param {Object} emailData - Email data to retry
   * @param {string} subscriberEmail - Subscriber's email
   */
  async retryEmail(emailData, subscriberEmail) {
    try {
      // Import sendEmail function to avoid circular dependencies
      const { sendEmail } = await import('./emailService.js');
      
      const result = await sendEmail({
        to: subscriberEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      if (result.success) {
        // Clear retry tracking on success
        const retryKey = `${subscriberEmail}_${this.categorizeError(emailData.error)}`;
        this.failedEmails.delete(retryKey);
        
        logger.info('Email retry successful', { subscriberEmail });
        
        // Update subscriber success info
        await this.updateSubscriberSuccess(subscriberEmail);
      } else {
        throw new Error(result.error || 'Retry failed');
      }
    } catch (error) {
      await this.handleEmailFailure(emailData, error, subscriberEmail);
    }
  }

  /**
   * Handle permanent email failure
   * @param {string} subscriberEmail - Subscriber's email
   * @param {string} errorType - Type of error
   */
  async handlePermanentFailure(subscriberEmail, errorType) {
    try {
      const subscriber = await Subscriber.findOne({ email: subscriberEmail });
      
      if (subscriber) {
        // Mark as permanently failed based on error type
        if (errorType === 'invalid_email') {
          subscriber.isActive = false;
          subscriber.failureReason = 'Invalid email address';
          subscriber.permanentFailure = true;
        } else if (errorType === 'spam_block') {
          subscriber.isActive = false;
          subscriber.failureReason = 'Marked as spam/blocked';
          subscriber.permanentFailure = true;
        }
        
        subscriber.lastFailureAt = new Date();
        subscriber.failureCount = (subscriber.failureCount || 0) + 1;
        
        await subscriber.save();
        
        logger.warn('Subscriber marked as permanent failure', {
          subscriberEmail,
          errorType,
          failureCount: subscriber.failureCount
        });
      }
    } catch (error) {
      logger.error('Error handling permanent failure', {
        subscriberEmail,
        error: error.message
      });
    }
  }

  /**
   * Update subscriber with failure information
   * @param {string} subscriberEmail - Subscriber's email
   * @param {string} errorType - Type of error
   */
  async updateSubscriberFailure(subscriberEmail, errorType) {
    try {
      await Subscriber.findOneAndUpdate(
        { email: subscriberEmail },
        {
          $inc: { failureCount: 1 },
          $set: { 
            lastFailureAt: new Date(),
            lastFailureType: errorType
          }
        }
      );
    } catch (error) {
      logger.error('Error updating subscriber failure', {
        subscriberEmail,
        error: error.message
      });
    }
  }

  /**
   * Update subscriber with success information
   * @param {string} subscriberEmail - Subscriber's email
   */
  async updateSubscriberSuccess(subscriberEmail) {
    try {
      await Subscriber.findOneAndUpdate(
        { email: subscriberEmail },
        {
          $set: { 
            lastEmailSent: new Date(),
            permanentFailure: false
          },
          $unset: { 
            lastFailureAt: 1,
            lastFailureType: 1,
            failureReason: 1
          }
        }
      );
    } catch (error) {
      logger.error('Error updating subscriber success', {
        subscriberEmail,
        error: error.message
      });
    }
  }

  /**
   * Get email health statistics
   * @returns {Object} Email health metrics
   */
  async getEmailHealthStats() {
    try {
      const stats = await Subscriber.aggregate([
        {
          $group: {
            _id: null,
            totalSubscribers: { $sum: 1 },
            activeSubscribers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            permanentFailures: {
              $sum: { $cond: [{ $eq: ['$permanentFailure', true] }, 1, 0] }
            },
            recentFailures: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$lastFailureAt', null] },
                      { $gte: ['$lastFailureAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            avgFailureCount: { $avg: '$failureCount' }
          }
        }
      ]);

      const result = stats[0] || {};
      return {
        totalSubscribers: result.totalSubscribers || 0,
        activeSubscribers: result.activeSubscribers || 0,
        permanentFailures: result.permanentFailures || 0,
        recentFailures: result.recentFailures || 0,
        avgFailureCount: parseFloat((result.avgFailureCount || 0).toFixed(2)),
        healthPercentage: result.totalSubscribers > 0 
          ? ((result.activeSubscribers / result.totalSubscribers) * 100).toFixed(1) 
          : 100
      };
    } catch (error) {
      logger.error('Error getting email health stats', { error: error.message });
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        permanentFailures: 0,
        recentFailures: 0,
        avgFailureCount: 0,
        healthPercentage: 0
      };
    }
  }

  /**
   * Clean up failed emails tracking (call periodically)
   */
  cleanupFailedTracking() {
    // Remove old retry tracking (older than 24 hours)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [key, data] of this.failedEmails.entries()) {
      if (data.timestamp && data.timestamp < cutoffTime) {
        this.failedEmails.delete(key);
      }
    }
    
    logger.info('Cleaned up failed email tracking', {
      remainingEntries: this.failedEmails.size
    });
  }
}

// Export singleton instance
export default new EmailErrorHandler();
