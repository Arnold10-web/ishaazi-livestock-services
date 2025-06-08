// controllers/emailTestController.js
import { 
  testEmailConfiguration, 
  sendTestEmail, 
  testWelcomeEmail, 
  emailHealthCheck, 
  generateEmailConfigReport 
} from '../utils/emailTestUtils.js';

/**
 * Test email configuration endpoint
 * GET /api/email/test/config
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
 * POST /api/email/test/send
 * Body: { email: "test@example.com" }
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
 * POST /api/email/test/welcome
 * Body: { email: "test@example.com", subscriptionType: "all" }
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
 * POST /api/email/test/health
 * Body: { email: "test@example.com" } (optional)
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
 * GET /api/email/status
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
