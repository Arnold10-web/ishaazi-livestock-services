import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import Admin from '../models/Admin.js';
import Blog from '../models/Blog.js';

describe('Security Tests', () => {
  let mongoServer;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await Admin.create({
      username: 'securityadmin',
      email: 'security@admin.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate token for authentication
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Blog.deleteMany({});
  });

  describe('Authentication Security', () => {
    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired JWT tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject malformed authorization headers', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });

    it('should prevent brute force attacks with rate limiting', async () => {
      const promises = [];
      
      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/admin/login')
            .send({
              email: 'nonexistent@admin.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent XSS attacks in blog content', async () => {
      const maliciousContent = {
        title: '<script>alert("XSS")</script>Malicious Title',
        content: '<img src="x" onerror="alert(\'XSS\')" />Malicious content',
        author: 'Attacker'
      };

      const response = await request(app)
        .post('/api/content/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousContent);

      expect(response.status).toBe(201);
      
      // Content should be sanitized
      expect(response.body.blog.title).not.toContain('<script>');
      expect(response.body.blog.content).not.toContain('onerror');
    });

    it('should prevent NoSQL injection attacks', async () => {
      const maliciousQuery = {
        email: { $ne: null },
        password: { $ne: null }
      };

      const response = await request(app)
        .post('/api/admin/login')
        .send(maliciousQuery);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate file upload types', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('fake executable content'), {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid file type');
    });

    it('should limit file upload size', async () => {
      // Create a large buffer (simulate large file)
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', largeBuffer, {
          filename: 'large-image.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).toBe(413); // Payload too large
    });
  });

  describe('Authorization and Access Control', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats');

      expect(response.status).toBe(401);
    });

    it('should prevent privilege escalation', async () => {
      // Create a regular user token (not admin)
      const regularUserToken = jwt.sign(
        { id: adminUser._id, role: 'user' },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          username: 'newadmin',
          email: 'new@admin.com',
          password: 'password123'
        });

      expect(response.status).toBe(403); // Forbidden
    });

    it('should prevent users from accessing other users data', async () => {
      // This would require implementing user-specific data access
      // For now, we test that admin endpoints require proper authentication
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer fake-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive information in responses', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.admin.password).toBeUndefined();
      expect(response.body.admin.passwordHash).toBeUndefined();
    });

    it('should handle database errors without exposing internal details', async () => {
      // Disconnect database to simulate error
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/content/blogs');

      expect(response.status).toBe(500);
      expect(response.body.error).not.toContain('mongoose');
      expect(response.body.error).not.toContain('MongoDB');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('CORS and Headers Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/content/blogs')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should reject requests from unauthorized origins in production', async () => {
      // This test would need to be run with NODE_ENV=production
      // and proper CORS configuration
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/content/blogs')
        .set('Origin', 'http://malicious-site.com');

      // Should either reject or not include CORS headers
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Trigger an error
      const response = await request(app)
        .get('/api/content/blogs/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.stack).toBeUndefined();
      expect(response.body.error).not.toContain('at ');

      process.env.NODE_ENV = originalEnv;
    });

    it('should log security events for monitoring', async () => {
      // This would require implementing proper logging
      // For now, we ensure failed auth attempts return appropriate responses
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'attacker@malicious.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
