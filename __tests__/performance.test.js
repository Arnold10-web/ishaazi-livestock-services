import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import Admin from '../models/Admin.js';
import Blog from '../models/Blog.js';
import News from '../models/News.js';

describe('Performance Tests', () => {
  let mongoServer;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await Admin.create({
      username: 'perfadmin',
      email: 'perf@admin.com',
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
    await News.deleteMany({});
  });

  describe('API Response Times', () => {
    beforeEach(async () => {
      // Create test data for performance testing
      const blogs = Array.from({ length: 100 }, (_, i) => ({
        title: `Performance Test Blog ${i + 1}`,
        content: `This is content for performance test blog ${i + 1}. `.repeat(10),
        author: 'Performance Tester',
        category: i % 2 === 0 ? 'Agriculture' : 'Livestock',
        tags: ['performance', 'test'],
        published: true
      }));

      await Blog.create(blogs);
    });

    it('should respond to blog listing within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/content/blogs');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.blogs).toBeDefined();
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/content/blogs?page=1&limit=10');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Paginated requests should be faster
      expect(response.body.blogs.length).toBe(10);
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/content/blogs?search=Performance');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(800); // Search should be reasonably fast
    });

    it('should handle category filtering efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/content/blogs?category=Agriculture');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(600); // Filtering should be fast
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(async () => {
      // Create some test data
      await Blog.create({
        title: 'Concurrent Test Blog',
        content: 'Content for concurrent testing',
        author: 'Concurrent Tester',
        published: true
      });
    });

    it('should handle multiple concurrent read requests', async () => {
      const concurrentRequests = 10;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app).get('/api/content/blogs')
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(1000);
    });

    it('should handle concurrent write requests', async () => {
      const concurrentWrites = 5;
      const promises = [];

      for (let i = 0; i < concurrentWrites; i++) {
        promises.push(
          request(app)
            .post('/api/content/blogs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              title: `Concurrent Blog ${i}`,
              content: `Content for concurrent blog ${i}`,
              author: 'Concurrent Author'
            })
        );
      }

      const responses = await Promise.all(promises);

      // All writes should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all blogs were created
      const blogs = await Blog.find({ title: /Concurrent Blog/ });
      expect(blogs.length).toBe(concurrentWrites);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and process large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        title: `Memory Test Blog ${i}`,
        content: 'Large content '.repeat(100),
        author: 'Memory Tester',
        published: true
      }));

      await Blog.create(largeDataset);

      // Process the data
      const response = await request(app)
        .get('/api/content/blogs?limit=1000');

      expect(response.status).toBe(200);

      // Check memory usage hasn't grown excessively
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle large file uploads efficiently', async () => {
      // Simulate a moderately large file (1MB)
      const largeBuffer = Buffer.alloc(1024 * 1024, 'a');

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', largeBuffer, {
          filename: 'large-test.jpg',
          contentType: 'image/jpeg'
        });

      const uploadTime = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(uploadTime).toBeLessThan(5000); // Should upload within 5 seconds
    });
  });

  describe('Database Performance', () => {
    beforeEach(async () => {
      // Create indexed test data
      const blogs = Array.from({ length: 500 }, (_, i) => ({
        title: `DB Performance Blog ${i}`,
        content: `Content ${i}`,
        author: 'DB Tester',
        category: ['Agriculture', 'Livestock', 'Technology'][i % 3],
        published: i % 4 !== 0, // 75% published
        createdAt: new Date(Date.now() - i * 1000 * 60) // Spread over time
      }));

      await Blog.create(blogs);
    });

    it('should perform complex queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/content/blogs?category=Agriculture&search=Performance&page=1&limit=20');

      const queryTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(300); // Complex queries should be fast with indexes
    });

    it('should handle sorting efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/content/blogs?sort=createdAt&order=desc&limit=50');

      const sortTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(sortTime).toBeLessThan(400); // Sorting should be efficient
      
      // Verify sorting is correct
      const blogs = response.body.blogs;
      for (let i = 1; i < blogs.length; i++) {
        const current = new Date(blogs[i].createdAt);
        const previous = new Date(blogs[i - 1].createdAt);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });

    it('should handle aggregation queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      const aggregationTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(aggregationTime).toBeLessThan(1000); // Aggregation should complete within 1 second
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('Caching Performance', () => {
    beforeEach(async () => {
      await Blog.create({
        title: 'Cache Test Blog',
        content: 'Content for cache testing',
        author: 'Cache Tester',
        published: true
      });
    });

    it('should serve cached responses faster', async () => {
      // First request (cache miss)
      const firstStart = Date.now();
      const firstResponse = await request(app)
        .get('/api/content/blogs');
      const firstTime = Date.now() - firstStart;

      expect(firstResponse.status).toBe(200);

      // Second request (cache hit)
      const secondStart = Date.now();
      const secondResponse = await request(app)
        .get('/api/content/blogs');
      const secondTime = Date.now() - secondStart;

      expect(secondResponse.status).toBe(200);
      
      // Cached response should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5);
    });

    it('should invalidate cache appropriately', async () => {
      // Initial request to populate cache
      await request(app).get('/api/content/blogs');

      // Modify data
      await request(app)
        .post('/api/content/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Blog for Cache Test',
          content: 'New content',
          author: 'Cache Tester'
        });

      // Request should return updated data
      const response = await request(app)
        .get('/api/content/blogs');

      expect(response.status).toBe(200);
      expect(response.body.blogs.some(blog => 
        blog.title === 'New Blog for Cache Test'
      )).toBe(true);
    });
  });
});
