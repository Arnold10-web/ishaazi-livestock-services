// utils/emailTestUtils.js
import nodemailer from 'nodemailer';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * Test email configuration and connectivity
 */
export const testEmailConfiguration = async () => {
  try {
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify SMTP connection
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('✅ Email configuration is valid and server is ready to send emails');
      return { success: true, message: 'Email configuration verified successfully' };
    } else {
      console.log('❌ Email configuration failed verification');
      return { success: false, message: 'Email configuration verification failed' };
    }
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { 
      success: false, 
      message: 'Email configuration error', 
      error: error.message 
    };
  }
};

/**
 * Send a test email to verify email sending functionality
 */
export const sendTestEmail = async (testEmail) => {
  try {
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const testMailOptions = {
      from: `"Ishaazi Livestock Services Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🧪 Email Configuration Test - Ishaazi Livestock Services',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; }
                .content { padding: 40px 30px; text-align: center; }
                .success-icon { font-size: 60px; margin-bottom: 20px; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧪 Email Test Successful!</h1>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2>Email Configuration Working Perfectly</h2>
                    <p>This is a test email to verify that your email configuration is working correctly.</p>
                    <p><strong>Test Details:</strong></p>
                    <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <li>📧 Sent to: ${testEmail}</li>
                        <li>⏰ Time: ${new Date().toLocaleString()}</li>
                        <li>🌐 Environment: ${process.env.NODE_ENV || 'development'}</li>
                        <li>📬 Service: ${process.env.EMAIL_SERVICE || 'gmail'}</li>
                    </ul>
                    <p style="margin-top: 30px;">Your newsletter system is ready to send emails!</p>
                </div>
                <div class="footer">
                    <p><strong>Ishaazi Livestock Services</strong></p>
                    <p>Newsletter System Test</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(testMailOptions);
    
    console.log(`✅ Test email sent successfully to ${testEmail}`);
    return { 
      success: true, 
      message: `Test email sent successfully to ${testEmail}` 
    };
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return { 
      success: false, 
      message: 'Failed to send test email', 
      error: error.message 
    };
  }
};

/**
 * Test welcome email functionality
 */
export const testWelcomeEmail = async (testEmail, subscriptionType = 'all') => {
  try {
    const result = await sendWelcomeEmail(testEmail, subscriptionType);
    
    if (result.success) {
      console.log(`✅ Welcome email test successful to ${testEmail}`);
      return { 
        success: true, 
        message: `Welcome email sent successfully to ${testEmail}` 
      };
    } else {
      console.log(`❌ Welcome email test failed: ${result.error}`);
      return { 
        success: false, 
        message: 'Welcome email test failed', 
        error: result.error 
      };
    }
  } catch (error) {
    console.error('❌ Welcome email test error:', error.message);
    return { 
      success: false, 
      message: 'Welcome email test error', 
      error: error.message 
    };
  }
};

/**
 * Comprehensive email system health check
 */
export const emailHealthCheck = async (testEmail = null) => {
  console.log('🔍 Starting email system health check...\n');
  
  const results = {
    configuration: null,
    testEmail: null,
    welcomeEmail: null,
    overall: false
  };

  // Test 1: Configuration verification
  console.log('1. Testing email configuration...');
  results.configuration = await testEmailConfiguration();
  console.log(`   Result: ${results.configuration.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Message: ${results.configuration.message}\n`);

  // Test 2: Send test email (if test email provided and configuration passed)
  if (testEmail && results.configuration.success) {
    console.log('2. Testing email sending functionality...');
    results.testEmail = await sendTestEmail(testEmail);
    console.log(`   Result: ${results.testEmail.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Message: ${results.testEmail.message}\n`);

    // Test 3: Welcome email functionality
    console.log('3. Testing welcome email template...');
    results.welcomeEmail = await testWelcomeEmail(testEmail, 'all');
    console.log(`   Result: ${results.welcomeEmail.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Message: ${results.welcomeEmail.message}\n`);
  } else if (!testEmail) {
    console.log('2. ⏭️  Skipping email sending tests (no test email provided)\n');
    console.log('3. ⏭️  Skipping welcome email tests (no test email provided)\n');
  } else {
    console.log('2. ⏭️  Skipping email sending tests (configuration failed)\n');
    console.log('3. ⏭️  Skipping welcome email tests (configuration failed)\n');
  }

  // Overall health assessment
  results.overall = results.configuration.success && 
                   (!testEmail || (results.testEmail?.success && results.welcomeEmail?.success));

  console.log('📊 Email System Health Check Summary:');
  console.log('=====================================');
  console.log(`Configuration: ${results.configuration.success ? '✅' : '❌'}`);
  console.log(`Test Email: ${results.testEmail ? (results.testEmail.success ? '✅' : '❌') : '⏭️ '}`);
  console.log(`Welcome Email: ${results.welcomeEmail ? (results.welcomeEmail.success ? '✅' : '❌') : '⏭️ '}`);
  console.log(`Overall Status: ${results.overall ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}\n`);

  if (!results.overall) {
    console.log('🔧 Troubleshooting Tips:');
    console.log('========================');
    console.log('1. Check your .env file contains correct EMAIL_USER and EMAIL_PASS values');
    console.log('2. For Gmail, use an App Password instead of your regular password');
    console.log('3. Ensure EMAIL_SERVICE is set correctly (gmail, outlook, etc.)');
    console.log('4. Check your firewall/network settings allow SMTP connections');
    console.log('5. Verify the email account has proper sending permissions\n');
  }

  return results;
};

/**
 * Generate email configuration report
 */
export const generateEmailConfigReport = () => {
  console.log('📧 Email Configuration Report');
  console.log('=============================');
  console.log(`Service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
  console.log(`User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`Password: ${process.env.EMAIL_PASS ? '***configured***' : 'Not configured'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=============================\n');

  const missingConfig = [];
  if (!process.env.EMAIL_USER) missingConfig.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missingConfig.push('EMAIL_PASS');
  if (!process.env.FRONTEND_URL) missingConfig.push('FRONTEND_URL');

  if (missingConfig.length > 0) {
    console.log('⚠️  Missing Configuration:');
    missingConfig.forEach(config => console.log(`   - ${config}`));
    console.log('\n');
  }

  return {
    configured: missingConfig.length === 0,
    missing: missingConfig,
    service: process.env.EMAIL_SERVICE || null,
    user: process.env.EMAIL_USER || null,
    hasPassword: !!process.env.EMAIL_PASS,
    frontendUrl: process.env.FRONTEND_URL || null
  };
};

export default {
  testEmailConfiguration,
  sendTestEmail,
  testWelcomeEmail,
  emailHealthCheck,
  generateEmailConfigReport
};
