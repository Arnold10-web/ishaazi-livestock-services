import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import Admin from '../models/Admin.js';
import Blog from '../models/Blog.js';
import News from '../models/News.js';

describe('Integration Tests - Complete User Workflows', () => {
  let mongoServer;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await Admin.create({
      username: 'integrationadmin',
      email: 'integration@admin.com',
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
    // Clean up test data
    await Blog.deleteMany({});
    await News.deleteMany({});
  });

  describe('Complete Blog Management Workflow', () => {
    it('should complete full blog lifecycle: create -> read -> update -> delete', async () => {
      // 1. Create a blog
      const blogData = {
        title: 'Integration Test Blog',
        content: 'This is a test blog for integration testing',
        author: 'Integration Tester',
        category: 'Technology',
        tags: ['test', 'integration'],
        published: false
      };

      const createResponse = await request(app)
        .post('/api/content/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(blogData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const blogId = createResponse.body.blog._id;

      // 2. Read the created blog
      const readResponse = await request(app)
        .get(`/api/content/blogs/${blogId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.blog.title).toBe(blogData.title);

      // 3. Update the blog
      const updateData = {
        title: 'Updated Integration Test Blog',
        published: true
      };

      const updateResponse = await request(app)
        .put(`/api/content/blogs/${blogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.blog.title).toBe(updateData.title);
      expect(updateResponse.body.blog.published).toBe(true);

      // 4. Delete the blog
      const deleteResponse = await request(app)
        .delete(`/api/content/blogs/${blogId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // 5. Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/content/blogs/${blogId}`);

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Authentication and Authorization Workflow', () => {
    it('should handle complete authentication flow', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'integration@admin.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      const token = loginResponse.body.token;

      // 2. Access protected resource
      const protectedResponse = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.admin.email).toBe('integration@admin.com');

      // 3. Try to access without token
      const unauthorizedResponse = await request(app)
        .get('/api/admin/profile');

      expect(unauthorizedResponse.status).toBe(401);
    });
  });

  describe('Search and Filtering Workflow', () => {
    beforeEach(async () => {
      // Create test data for searching
      await Blog.create([
        {
          title: 'Organic Farming Techniques',
          content: 'Learn about sustainable organic farming methods',
          author: 'Farm Expert',
          category: 'Agriculture',
          tags: ['organic', 'sustainable'],
          published: true
        },
        {
          title: 'Livestock Management',
          content: 'Best practices for managing livestock',
          author: 'Livestock Specialist',
          category: 'Livestock',
          tags: ['livestock', 'management'],
          published: true
        },
        {
          title: 'Draft Article',
          content: 'This is a draft article',
          author: 'Writer',
          category: 'General',
          published: false
        }
      ]);
    });

    it('should search and filter content correctly', async () => {
      // 1. Search by title
      const searchResponse = await request(app)
        .get('/api/content/blogs?search=Organic');

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.blogs.length).toBe(1);
      expect(searchResponse.body.blogs[0].title).toContain('Organic');

      // 2. Filter by category
      const categoryResponse = await request(app)
        .get('/api/content/blogs?category=Livestock');

      expect(categoryResponse.status).toBe(200);
      expect(categoryResponse.body.blogs.length).toBe(1);
      expect(categoryResponse.body.blogs[0].category).toBe('Livestock');

      // 3. Get only published articles (default behavior)
      const publishedResponse = await request(app)
        .get('/api/content/blogs');

      expect(publishedResponse.status).toBe(200);
      expect(publishedResponse.body.blogs.length).toBe(2); // Only published
      expect(publishedResponse.body.blogs.every(blog => blog.published)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      // 1. Invalid blog data
      const invalidBlogResponse = await request(app)
        .post('/api/content/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '', // Empty title
          content: '' // Empty content
        });

      expect(invalidBlogResponse.status).toBe(400);
      expect(invalidBlogResponse.body.success).toBe(false);

      // 2. Invalid ID format
      const invalidIdResponse = await request(app)
        .get('/api/content/blogs/invalid-id');

      expect(invalidIdResponse.status).toBe(400);

      // 3. Non-existent resource
      const fakeId = new mongoose.Types.ObjectId();
      const notFoundResponse = await request(app)
        .get(`/api/content/blogs/${fakeId}`);

      expect(notFoundResponse.status).toBe(404);
    });
  });

  describe('Performance and Pagination', () => {
    beforeEach(async () => {
      // Create multiple blog posts for pagination testing
      const blogs = Array.from({ length: 15 }, (_, i) => ({
        title: `Blog Post ${i + 1}`,
        content: `Content for blog post ${i + 1}`,
        author: 'Test Author',
        published: true
      }));

      await Blog.create(blogs);
    });

    it('should handle pagination correctly', async () => {
      // 1. First page
      const page1Response = await request(app)
        .get('/api/content/blogs?page=1&limit=5');

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.blogs.length).toBe(5);
      expect(page1Response.body.pagination.currentPage).toBe(1);
      expect(page1Response.body.pagination.totalPages).toBe(3);

      // 2. Second page
      const page2Response = await request(app)
        .get('/api/content/blogs?page=2&limit=5');

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.blogs.length).toBe(5);
      expect(page2Response.body.pagination.currentPage).toBe(2);

      // 3. Last page
      const page3Response = await request(app)
        .get('/api/content/blogs?page=3&limit=5');

      expect(page3Response.status).toBe(200);
      expect(page3Response.body.blogs.length).toBe(5);
      expect(page3Response.body.pagination.currentPage).toBe(3);
    });
  });
});
