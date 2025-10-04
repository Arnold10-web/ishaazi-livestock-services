/**
 * @file SendGrid Webhook Routes
 * @description Handle SendGrid webhook events for email analytics and compliance
 * @module routes/sendgridWebhookRoutes
 */

import express from 'express';
import crypto from 'crypto';
import ActivityLog from '../models/ActivityLog.js';
import Subscriber from '../models/Subscriber.js';
import Newsletter from '../models/Newsletter.js';

const router = express.Router();

/**
 * Verify SendGrid webhook signature
 */
const verifyWebhook = (req, res, next) => {
  const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
  const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');
  
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing required headers' });
  }

  // Verify timestamp (reject old requests)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 600) { // 10 minutes
    return res.status(401).json({ error: 'Request too old' });
  }

  // Verify signature if webhook key is set
  if (process.env.SENDGRID_WEBHOOK_KEY) {
    const payload = JSON.stringify(req.body);
    const data = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SENDGRID_WEBHOOK_KEY)
      .update(data, 'utf8')
      .digest('base64');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  next();
};

/**
 * Handle SendGrid webhook events
 * @route POST /api/sendgrid/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const events = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Expected array of events' });
    }

    console.log(`[SENDGRID] Received ${events.length} webhook events`);

    for (const event of events) {
      await processWebhookEvent(event);
    }

    res.status(200).json({ message: 'Events processed successfully' });
  } catch (error) {
    console.error('[SENDGRID] Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Process individual webhook event
 */
async function processWebhookEvent(event) {
  const { event: eventType, email, timestamp, sg_message_id } = event;

  try {
    // Update subscriber stats based on event type
    switch (eventType) {
      case 'delivered':
        await updateSubscriberStats(email, { delivered: 1 });
        await logEmailEvent(email, 'delivered', event);
        break;

      case 'open':
        await updateSubscriberStats(email, { opens: 1 });
        await Subscriber.findOneAndUpdate(
          { email },
          { 
            $set: { lastOpened: new Date(timestamp * 1000) },
            $inc: { openCount: 1 }
          }
        );
        await logEmailEvent(email, 'opened', event);
        break;

      case 'click':
        await updateSubscriberStats(email, { clicks: 1 });
        await Subscriber.findOneAndUpdate(
          { email },
          { 
            $set: { lastClicked: new Date(timestamp * 1000) },
            $inc: { clickCount: 1 }
          }
        );
        await logEmailEvent(email, 'clicked', event);
        break;

      case 'bounce':
        await handleBounce(email, event);
        break;

      case 'dropped':
        await handleDrop(email, event);
        break;

      case 'spam_report':
        await handleSpamReport(email, event);
        break;

      case 'unsubscribe':
        await handleUnsubscribe(email, event);
        break;

      case 'group_unsubscribe':
        await handleGroupUnsubscribe(email, event);
        break;

      default:
        console.log(`[SENDGRID] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[SENDGRID] Error processing ${eventType} event:`, error);
  }
}

/**
 * Update subscriber statistics
 */
async function updateSubscriberStats(email, stats) {
  const updateQuery = {};
  Object.keys(stats).forEach(key => {
    updateQuery[`stats.${key}`] = stats[key];
  });

  await Subscriber.findOneAndUpdate(
    { email },
    { $inc: updateQuery },
    { upsert: false }
  );
}

/**
 * Handle bounce events
 */
async function handleBounce(email, event) {
  const { reason, type } = event;
  
  await updateSubscriberStats(email, { bounces: 1 });
  
  // For hard bounces, deactivate the subscriber
  if (type === 'bounce') {
    await Subscriber.findOneAndUpdate(
      { email },
      { 
        $set: { 
          isActive: false,
          bounceReason: reason,
          lastBounced: new Date(event.timestamp * 1000)
        }
      }
    );
  }

  await logEmailEvent(email, 'bounced', event);
}

/**
 * Handle dropped emails
 */
async function handleDrop(email, event) {
  await updateSubscriberStats(email, { drops: 1 });
  await logEmailEvent(email, 'dropped', event);
}

/**
 * Handle spam reports
 */
async function handleSpamReport(email, event) {
  await Subscriber.findOneAndUpdate(
    { email },
    { 
      $set: { 
        isActive: false,
        spamReported: true,
        spamReportedAt: new Date(event.timestamp * 1000)
      }
    }
  );

  await logEmailEvent(email, 'spam_report', event);
}

/**
 * Handle unsubscribe events
 */
async function handleUnsubscribe(email, event) {
  await Subscriber.findOneAndUpdate(
    { email },
    { 
      $set: { 
        isActive: false,
        unsubscribedAt: new Date(event.timestamp * 1000),
        unsubscribeReason: 'user_request'
      }
    }
  );

  await logEmailEvent(email, 'unsubscribed', event);
}

/**
 * Handle group unsubscribe events
 */
async function handleGroupUnsubscribe(email, event) {
  const { asm_group_id } = event;
  
  // You could map group IDs to subscription types
  await Subscriber.findOneAndUpdate(
    { email },
    { 
      $set: { 
        [`groupUnsubscribes.${asm_group_id}`]: new Date(event.timestamp * 1000)
      }
    }
  );

  await logEmailEvent(email, 'group_unsubscribed', event);
}

/**
 * Log email events for tracking
 */
async function logEmailEvent(email, eventType, eventData) {
  await ActivityLog.create({
    action: `email_${eventType}`,
    resource: 'email_tracking',
    details: {
      email,
      eventType,
      timestamp: new Date(eventData.timestamp * 1000),
      messageId: eventData.sg_message_id,
      eventData: eventData
    },
    ipAddress: '0.0.0.0', // SendGrid webhook
    userAgent: 'SendGrid-Webhook'
  });
}

router.post('/webhook', verifyWebhook, handleWebhook);

export default router;