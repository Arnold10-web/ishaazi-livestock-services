// services/emailService.js
import nodemailer from 'nodemailer';

// Email configuration - you'll need to update these with your actual email credentials
const createTransporter = () => {
  const config = {
    service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email
      pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password' // Your app password (not regular password)
    },
    pool: true, // Use pooled connections for better performance
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Limit messages per connection
    rateLimit: 14 // Limit to 14 messages per second
  };

  return nodemailer.createTransporter(config);
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { 
      success: false, 
      message: 'Email configuration failed', 
      error: error.message 
    };
  }
};

// Validate email template content
const validateNewsletterContent = (newsletter) => {
  const errors = [];
  
  if (!newsletter.title || newsletter.title.trim().length === 0) {
    errors.push('Newsletter title is required');
  }
  
  if (!newsletter.body || newsletter.body.trim().length === 0) {
    errors.push('Newsletter content is required');
  }
  
  if (!newsletter.subject || newsletter.subject.trim().length === 0) {
    errors.push('Newsletter subject is required');
  }

  // Check for basic HTML structure if body contains HTML
  if (newsletter.body.includes('<') && newsletter.body.includes('>')) {
    const hasOpeningTag = /<[^>]+>/.test(newsletter.body);
    const hasClosingTag = /<\/[^>]+>/.test(newsletter.body);
    if (hasOpeningTag && !hasClosingTag) {
      errors.push('Newsletter content contains malformed HTML');
    }
  }

  return errors;
};

// Enhanced newsletter template with better mobile responsiveness and tracking
const createNewsletterTemplate = (title, content, subscriberEmail, newsletterId = null) => {
  const trackingPixelUrl = newsletterId ? 
    `http://localhost:5000/api/email/track/open/${newsletterId}/${encodeURIComponent(subscriberEmail)}` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .content h1, .content h2, .content h3 {
            color: #22c55e;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .content h2 {
            border-bottom: 2px solid #22c55e;
            padding-bottom: 10px;
            font-size: 24px;
        }
        .content p {
            margin-bottom: 16px;
            color: #333;
            font-size: 16px;
            line-height: 1.7;
        }
        .content ul, .content ol {
            margin-bottom: 20px;
            padding-left: 20px;
        }
        .content li {
            margin-bottom: 8px;
            color: #333;
            line-height: 1.6;
        }
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
        }
        .content blockquote {
            border-left: 4px solid #22c55e;
            padding: 15px 20px;
            margin: 20px 0;
            font-style: italic;
            background-color: #f9f9f9;
            border-radius: 0 8px 8px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            color: #6c757d;
            font-size: 14px;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #22c55e;
            text-decoration: none;
            font-weight: bold;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background-color 0.2s;
        }
        .social-links a:hover {
            background-color: rgba(34, 197, 94, 0.1);
        }
        .unsubscribe {
            margin-top: 20px;
            font-size: 12px;
            color: #6c757d;
            line-height: 1.4;
        }
        .unsubscribe a {
            color: #22c55e;
            text-decoration: underline;
        }
        .tracking-pixel {
            width: 1px;
            height: 1px;
            border: none;
            display: block;
        }
        
        /* Mobile Responsive */
        @media (max-width: 600px) {
            .container {
                margin: 0 10px;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
            .content h2 {
                font-size: 20px;
            }
            .content p {
                font-size: 15px;
            }
            .cta-button {
                padding: 12px 24px;
                font-size: 16px;
            }
            .social-links a {
                margin: 5px;
                font-size: 14px;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .container {
                background-color: #1f2937;
            }
            .content {
                color: #e5e7eb;
            }
            .content p, .content li {
                color: #d1d5db;
            }
            .content blockquote {
                background-color: #374151;
                color: #e5e7eb;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌾 Ishaazi Livestock Services</h1>
            <p>Your trusted partner in modern farming and livestock management</p>
        </div>
        
        <div class="content">
            <h2>📰 ${title}</h2>
            ${content}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000?utm_source=newsletter&utm_campaign=${encodeURIComponent(title)}" class="cta-button">Visit Our Website</a>
            </div>
        </div>
        
        <div class="footer">
            <h3 style="color: #22c55e; margin-bottom: 15px;">Stay Connected</h3>
            <div class="social-links">
                <a href="#" onclick="trackClick('facebook', '${newsletterId}', '${encodeURIComponent(subscriberEmail)}')">Facebook</a>
                <a href="#" onclick="trackClick('twitter', '${newsletterId}', '${encodeURIComponent(subscriberEmail)}')">Twitter</a>
                <a href="#" onclick="trackClick('linkedin', '${newsletterId}', '${encodeURIComponent(subscriberEmail)}')">LinkedIn</a>
                <a href="#" onclick="trackClick('instagram', '${newsletterId}', '${encodeURIComponent(subscriberEmail)}')">Instagram</a>
            </div>
            
            <p><strong>Ishaazi Livestock Services</strong></p>
            <p>📧 info@ishaazi.com | 📞 +256-xxx-xxx-xxx</p>
            <p>🏢 Kampala, Uganda</p>
            
            <div class="unsubscribe">
                <p>You're receiving this because you subscribed to our newsletter.</p>
                <p>Email sent to: ${subscriberEmail}</p>
                <p><a href="http://localhost:3000/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&source=newsletter">Unsubscribe</a> | <a href="http://localhost:3000/preferences?email=${encodeURIComponent(subscriberEmail)}">Update Preferences</a></p>
            </div>
        </div>
    </div>
    
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" alt="" class="tracking-pixel" />` : ''}
    
    <script>
        function trackClick(platform, newsletterId, email) {
            if (newsletterId && email) {
                fetch('http://localhost:5000/api/email/track/click/' + newsletterId + '/' + email + '?platform=' + platform, {
                    method: 'POST',
                    mode: 'no-cors'
                });
            }
        }
    </script>
</body>
</html>`;
};

// Welcome email template
const createWelcomeTemplate = (subscriberEmail, subscriptionType) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Ishaazi Livestock Services!</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: bold;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .welcome-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }
            .content h2 {
                color: #22c55e;
                margin-bottom: 20px;
                font-size: 24px;
            }
            .content p {
                margin-bottom: 20px;
                color: #333;
                font-size: 16px;
            }
            .subscription-details {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
                border-left: 4px solid #22c55e;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome!</h1>
            </div>
            
            <div class="content">
                <div class="welcome-icon">✅</div>
                <h2>Thank you for subscribing to our newsletter!</h2>
                <p>We're excited to have you join our community of farming enthusiasts and livestock professionals.</p>
                
                <div class="subscription-details">
                    <h3 style="color: #22c55e; margin-top: 0;">Your Subscription Details</h3>
                    <p><strong>Email:</strong> ${subscriberEmail}</p>
                    <p><strong>Subscription Type:</strong> ${subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                </div>
                
                <p>You'll receive updates about:</p>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <li>🌾 Latest farming techniques and tips</li>
                    <li>🐄 Livestock management insights</li>
                    <li>📰 Industry news and updates</li>
                    <li>🎯 Exclusive offers and events</li>
                </ul>
                
                <a href="http://localhost:3000" class="cta-button">Explore Our Website</a>
            </div>
            
            <div class="footer">
                <p><strong>Ishaazi Livestock Services</strong></p>
                <p>Your trusted partner in modern farming</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send newsletter to multiple subscribers with enhanced error handling and batching
export const sendNewsletter = async (newsletter, subscribers) => {
  // Validate newsletter content first
  const validationErrors = validateNewsletterContent(newsletter);
  if (validationErrors.length > 0) {
    return {
      sent: 0,
      failed: subscribers.length,
      errors: validationErrors.map(error => ({ error, email: 'validation' })),
      batchResults: []
    };
  }

  // Test email configuration before sending
  const configTest = await testEmailConfiguration();
  if (!configTest.success) {
    return {
      sent: 0,
      failed: subscribers.length,
      errors: [{ error: `Email configuration error: ${configTest.error}`, email: 'configuration' }],
      batchResults: []
    };
  }

  const transporter = createTransporter();
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
    batchResults: []
  };

  // Batch size for performance optimization
  const BATCH_SIZE = 50;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay

  // Split subscribers into batches for performance and rate limiting
  const batches = [];
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    batches.push(subscribers.slice(i, i + BATCH_SIZE));
  }

  console.log(`📧 Sending newsletter "${newsletter.title}" to ${subscribers.length} subscribers in ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchResults = {
      batchNumber: batchIndex + 1,
      sent: 0,
      failed: 0,
      errors: []
    };

    console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

    // Process emails in batch with Promise.allSettled for better error handling
    const emailPromises = batch.map(async (subscriber) => {
      try {
        // Validate email format before sending
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(subscriber.email)) {
          throw new Error('Invalid email format');
        }

        const htmlContent = createNewsletterTemplate(
          newsletter.title,
          newsletter.body,
          subscriber.email,
          newsletter._id || newsletter.id
        );

        const mailOptions = {
          from: `"Ishaazi Livestock Services" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
          to: subscriber.email,
          subject: newsletter.subject || newsletter.title,
          html: htmlContent,
          // Add tracking headers
          headers: {
            'X-Newsletter-ID': newsletter._id || newsletter.id,
            'X-Subscriber-ID': subscriber._id || subscriber.id,
            'List-Unsubscribe': `<http://localhost:3000/unsubscribe?email=${encodeURIComponent(subscriber.email)}>`,
            'List-ID': 'Ishaazi Livestock Services Newsletter'
          }
        };

        await transporter.sendMail(mailOptions);
        
        return { 
          success: true, 
          email: subscriber.email,
          subscriberId: subscriber._id || subscriber.id
        };
      } catch (error) {
        return { 
          success: false, 
          email: subscriber.email,
          subscriberId: subscriber._id || subscriber.id,
          error: error.message 
        };
      }
    });

    // Wait for all emails in this batch to complete
    const batchResults_promise = await Promise.allSettled(emailPromises);
    
    // Process batch results
    batchResults_promise.forEach(result => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          batchResults.sent++;
          results.sent++;
        } else {
          batchResults.failed++;
          results.failed++;
          batchResults.errors.push({
            email: result.value.email,
            subscriberId: result.value.subscriberId,
            error: result.value.error
          });
          results.errors.push({
            email: result.value.email,
            subscriberId: result.value.subscriberId,
            error: result.value.error
          });
        }
      } else {
        batchResults.failed++;
        results.failed++;
        batchResults.errors.push({
          email: 'unknown',
          error: result.reason?.message || 'Batch processing failed'
        });
        results.errors.push({
          email: 'unknown',
          error: result.reason?.message || 'Batch processing failed'
        });
      }
    });

    results.batchResults.push(batchResults);
    console.log(`✅ Batch ${batchIndex + 1} completed: ${batchResults.sent} sent, ${batchResults.failed} failed`);

    // Add delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log(`🎉 Newsletter sending completed: ${results.sent} sent, ${results.failed} failed`);
  
  return results;
};

// Send welcome email to new subscriber
export const sendWelcomeEmail = async (subscriberEmail, subscriptionType = 'all') => {
  const transporter = createTransporter();
  
  try {
    const htmlContent = createWelcomeTemplate(subscriberEmail, subscriptionType);
    
    await transporter.sendMail({
      from: `"Ishaazi Livestock Services" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
      to: subscriberEmail,
      subject: '🎉 Welcome to Ishaazi Livestock Services Newsletter!',
      html: htmlContent
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendNewsletter,
  sendWelcomeEmail
};
