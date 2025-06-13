import request from 'supertest';
import app from '../server.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import { sendNewsletterEmail } from '../services/emailService.js';

// Mock email service
jest.mock('../services/emailService.js');

describe('Newsletter Integration Tests', () => {
  let authToken;
  let testNewsletter;
  let testSubscribers;

  beforeEach(async () => {
    // Login as admin to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'testpassword123'
      });
    
    authToken = loginResponse.body.token;

    // Create test newsletter
    testNewsletter = await Newsletter.create({
      title: 'Test Newsletter',
      subject: 'Test Subject',
      body: '<h1>Test Content</h1><p>This is a test newsletter.</p>',
      targetSubscriptionTypes: ['all'],
      status: 'draft'
    });

    // Create test subscribers
    testSubscribers = await Subscriber.insertMany([
      {
        email: 'subscriber1@test.com',
        subscriptionType: 'newsletters',
        isActive: true
      },
      {
        email: 'subscriber2@test.com',
        subscriptionType: 'all',
        isActive: true
      },
      {
        email: 'inactive@test.com',
        subscriptionType: 'newsletters',
        isActive: false
      }
    ]);
  });

  afterEach(async () => {
    await Newsletter.deleteMany({});
    await Subscriber.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/newsletters', () => {
    test('should create newsletter with valid data', async () => {
      const newsletterData = {
        title: 'New Newsletter',
        subject: 'Newsletter Subject',
        body: '<p>Newsletter content</p>',
        targetSubscriptionTypes: ['newsletters']
      };

      const response = await request(app)
        .post('/api/newsletters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newsletterData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Newsletter');
      expect(response.body.data.status).toBe('draft');
    });

    test('should reject newsletter with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        subject: 'Subject',
        body: '<p>Content</p>'
      };

      const response = await request(app)
        .post('/api/newsletters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/newsletters')
        .send({
          title: 'Test',
          subject: 'Test',
          body: '<p>Test</p>'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/newsletters/:id/send', () => {
    test('should send newsletter to active subscribers', async () => {
      // Mock successful email sending
      sendNewsletterEmail.mockResolvedValue({
        sent: 2,
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sent).toBe(2);

      // Verify newsletter status updated
      const updatedNewsletter = await Newsletter.findById(testNewsletter._id);
      expect(updatedNewsletter.status).toBe('sent');
      expect(updatedNewsletter.sentTo).toBe(2);
    });

    test('should handle partial email failures', async () => {
      sendNewsletterEmail.mockResolvedValue({
        sent: 1,
        failed: 1,
        errors: [{ email: 'subscriber2@test.com', error: 'SMTP error' }]
      });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sent).toBe(1);
      expect(response.body.data.failed).toBe(1);
    });

    test('should prevent sending already sent newsletter', async () => {
      // Mark newsletter as sent
      await Newsletter.findByIdAndUpdate(testNewsletter._id, { status: 'sent' });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already been sent');
    });

    test('should handle no active subscribers', async () => {
      // Deactivate all subscribers
      await Subscriber.updateMany({}, { isActive: false });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No active subscribers');
    });
  });

  describe('GET /api/newsletters', () => {
    test('should return paginated newsletters', async () => {
      // Create additional newsletters
      await Newsletter.insertMany([
        { title: 'Newsletter 2', subject: 'Subject 2', body: '<p>Content 2</p>' },
        { title: 'Newsletter 3', subject: 'Subject 3', body: '<p>Content 3</p>' }
      ]);

      const response = await request(app)
        .get('/api/newsletters?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newsletters).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });

    test('should filter newsletters by status', async () => {
      await Newsletter.findByIdAndUpdate(testNewsletter._id, { status: 'sent' });

      const response = await request(app)
        .get('/api/newsletters?status=sent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.newsletters).toHaveLength(1);
      expect(response.body.data.newsletters[0].status).toBe('sent');
    });
  });

  describe('PUT /api/newsletters/:id', () => {
    test('should update draft newsletter', async () => {
      const updateData = {
        title: 'Updated Newsletter',
        subject: 'Updated Subject',
        body: '<p>Updated content</p>'
      };

      const response = await request(app)
        .put(`/api/newsletters/${testNewsletter._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Newsletter');
    });

    test('should prevent updating sent newsletter', async () => {
      await Newsletter.findByIdAndUpdate(testNewsletter._id, { status: 'sent' });

      const response = await request(app)
        .put(`/api/newsletters/${testNewsletter._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Should not update' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/newsletters/:id', () => {
    test('should delete draft newsletter', async () => {
      const response = await request(app)
        .delete(`/api/newsletters/${testNewsletter._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedNewsletter = await Newsletter.findById(testNewsletter._id);
      expect(deletedNewsletter).toBeNull();
    });

    test('should prevent deleting sent newsletter', async () => {
      await Newsletter.findByIdAndUpdate(testNewsletter._id, { status: 'sent' });

      const response = await request(app)
        .delete(`/api/newsletters/${testNewsletter._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Email Content Validation', () => {
    test('should validate HTML content', async () => {
      const invalidHTML = {
        title: 'Test Newsletter',
        subject: 'Test',
        body: '<p>Unclosed paragraph<div>Bad nesting</p></div>'
      };

      const response = await request(app)
        .post('/api/newsletters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidHTML);

      // Should still create but might warn about HTML issues
      expect(response.status).toBe(201);
    });

    test('should handle XSS attempts in content', async () => {
      const xssAttempt = {
        title: 'Test Newsletter',
        subject: 'Test',
        body: '<script>alert("XSS")</script><p>Safe content</p>'
      };

      const response = await request(app)
        .post('/api/newsletters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssAttempt);

      expect(response.status).toBe(201);
      // Script tags should be sanitized
      expect(response.body.data.body).not.toContain('<script>');
    });
  });

  describe('Subscription Type Targeting', () => {
    test('should send to specific subscription types only', async () => {
      testNewsletter.targetSubscriptionTypes = ['newsletters'];
      await testNewsletter.save();

      sendNewsletterEmail.mockResolvedValue({
        sent: 1, // Only newsletter subscribers
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sent).toBe(1);
    });

    test('should send to all subscribers when targetType is "all"', async () => {
      testNewsletter.targetSubscriptionTypes = ['all'];
      await testNewsletter.save();

      sendNewsletterEmail.mockResolvedValue({
        sent: 2, // All active subscribers
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post(`/api/newsletters/${testNewsletter._id}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sent).toBe(2);
    });
  });
});
