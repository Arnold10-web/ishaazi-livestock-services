// controllers/emailTestController.js
/**
 * Email Test Controller
 * 
 * This controller handles endpoints used to test email functionality, 
 * including configuration tests, sending test emails, welcome email testing,
 * and email system health checks.
 * 
 * These endpoints are primarily used by administrators to verify that the email
 * delivery system is functioning correctly and to diagnose potential issues.
 */
import { 
  testEmailConfiguration, 
  sendTestEmail, 
  testWelcomeEmail, 
  emailHealthCheck, 
  generateEmailConfigReport 
} from '../utils/emailTestUtils.js';

/**
 * Test email configuration endpoint
 * 
 * Verifies that the email system is configured correctly by checking all required 
 * environment variables and connection settings. Also generates a detailed configuration
 * report with information about the email service, authentication status, and missing settings.
 * 
 * @route GET /api/email/test/config
 * @access Admin only
 * @returns {Object} Response containing configuration test results and detailed report
 */
export const testEmailConfig = async (req, res) => {
  try {
    const result = await testEmailConfiguration();
    const configReport = generateEmailConfigReport();
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: {
        configurationTest: result,
        configurationReport: configReport
      },
      error: result.error || null
    });
  } catch (error) {
    console.error('Email configuration test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message
    });
  }
};

/**
 * Send test email endpoint
 * 
 * Sends a test email to the specified address to verify delivery functionality.
 * The test email contains diagnostic information about the server environment
 * and email configuration. This endpoint validates the email format before
 * attempting to send.
 * 
 * @route POST /api/email/test/send
 * @access Admin only
 * @param {Object} req.body.email - Target email address to send the test to
 * @returns {Object} Response containing the result of the test email attempt
 */
export const sendTestEmailEndpoint = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const result = await sendTestEmail(email);
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: { testEmail: result },
      error: result.error || null
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

/**
 * Test welcome email endpoint
 * 
 * Sends a test welcome email to verify that the onboarding email templates
 * are rendering correctly and being delivered. Can test different subscription
 * types to ensure all variants of the welcome email are working properly.
 * 
 * @route POST /api/email/test/welcome
 * @access Admin only
 * @param {Object} req.body.email - Target email address to send the test to
 * @param {string} [req.body.subscriptionType="all"] - Type of subscription welcome email to test
 * @returns {Object} Response containing the result of the welcome email test
 */
export const testWelcomeEmailEndpoint = async (req, res) => {
  try {
    const { email, subscriptionType = 'all' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const result = await testWelcomeEmail(email, subscriptionType);
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: { welcomeEmailTest: result },
      error: result.error || null
    });
  } catch (error) {
    console.error('Test welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test welcome email',
      error: error.message
    });
  }
};

/**
 * Comprehensive email health check endpoint
 * 
 * Performs a complete diagnostics check on the email system, including
 * configuration validation, connection tests, and optionally an end-to-end
 * delivery test if an email address is provided. This is useful for
 * troubleshooting email issues or verifying system health after configuration
 * changes.
 * 
 * @route POST /api/email/test/health
 * @access Admin only
 * @param {Object} [req.body.email] - Optional email address for delivery testing
 * @returns {Object} Response containing detailed health check results for all email subsystems
 */
export const emailHealthCheckEndpoint = async (req, res) => {
  try {
    const { email } = req.body || {};
    
    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    const results = await emailHealthCheck(email);
    
    res.status(results.overall ? 200 : 500).json({
      success: results.overall,
      message: results.overall 
        ? 'Email system is healthy and ready'
        : 'Email system has configuration or functionality issues',
      data: results
    });
  } catch (error) {
    console.error('Email health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Email health check failed',
      error: error.message
    });
  }
};

/**
 * Get email configuration status
 * 
 * Provides a simplified status report about the email configuration system,
 * focusing on whether required settings exist and what type of email service
 * is configured. This endpoint is less detailed than the test endpoints
 * and is suitable for dashboard status displays.
 * 
 * @route GET /api/email/status
 * @access Admin only
 * @returns {Object} Response containing email configuration status summary
 */
export const getEmailConfigStatus = async (req, res) => {
  try {
    const configReport = generateEmailConfigReport();
    
    res.status(200).json({
      success: true,
      message: 'Email configuration status retrieved',
      data: {
        configured: configReport.configured,
        missing: configReport.missing,
        hasRequiredSettings: configReport.configured,
        environment: process.env.NODE_ENV || 'development',
        serviceType: configReport.service || 'Not configured'
      }
    });
  } catch (error) {
    console.error('Get email config status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration status',
      error: error.message
    });
  }
};

export default {
  testEmailConfig,
  sendTestEmailEndpoint,
  testWelcomeEmailEndpoint,
  emailHealthCheckEndpoint,
  getEmailConfigStatus
};
