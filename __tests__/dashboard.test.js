import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Subscriber from '../models/Subscriber.js';
import Admin from '../models/Admin.js';

describe('Dashboard Controller Tests', () => {
  let adminToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/trial_test');
    }

    // Create admin user for authentication
    const adminUser = new Admin({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin'
    });
    await adminUser.save();

    // Get admin token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    adminToken = loginResponse.body.token;
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Blog.deleteMany({});
    await News.deleteMany({});
    await Event.deleteMany({});
    await Subscriber.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await Blog.deleteMany({});
    await News.deleteMany({});
    await Event.deleteMany({});
    await Subscriber.deleteMany({});
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/dashboard/stats', () => {
    test('should return dashboard statistics with empty data', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('activities');
      expect(response.body.data).toHaveProperty('quickActions');
      expect(response.body.data).toHaveProperty('contentDistribution');
      expect(response.body.data).toHaveProperty('contentTrend');
      expect(response.body.data).toHaveProperty('popularContent');
    });

    test('should calculate correct content statistics', async () => {
      // Create test data
      await Blog.create([
        {
          title: 'Test Blog 1',
          content: 'Test content',
          author: 'Test Author',
          category: 'farming',
          comments: [
            { name: 'User 1', comment: 'Great post!' },
            { name: 'User 2', comment: 'Very helpful' }
          ],
          views: 100
        },
        {
          title: 'Test Blog 2',
          content: 'Test content 2',
          author: 'Test Author',
          category: 'livestock',
          comments: [
            { name: 'User 3', comment: 'Excellent!' }
          ],
          views: 150
        }
      ]);

      await News.create([
        {
          title: 'Test News 1',
          content: 'News content',
          author: 'News Author',
          views: 200
        }
      ]);

      await Event.create([
        {
          title: 'Future Event',
          description: 'Event description',
          date: new Date('2025-12-15'),
          location: 'Test Location'
        },
        {
          title: 'Past Event',
          description: 'Past event description',
          date: new Date('2024-01-15'),
          location: 'Past Location'
        }
      ]);

      await Subscriber.create([
        {
          email: 'subscriber1@test.com',
          name: 'Subscriber 1'
        },
        {
          email: 'subscriber2@test.com',
          name: 'Subscriber 2'
        }
      ]);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.totalContent.value).toBe(4); // 2 blogs + 1 news + 2 events
      expect(response.body.data.stats.subscribers.value).toBe(2);
      expect(response.body.data.stats.events.value).toBe(1); // Only upcoming events
    });

    test('should calculate engagement rate correctly', async () => {
      // Create blog with comments
      await Blog.create({
        title: 'Test Blog',
        content: 'Test content',
        author: 'Test Author',
        category: 'farming',
        comments: [
          { name: 'User 1', comment: 'Comment 1' },
          { name: 'User 2', comment: 'Comment 2' },
          { name: 'User 3', comment: 'Comment 3' }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // With 1 blog and 3 comments, engagement should be 300%
      expect(response.body.data.stats.engagement.value).toBe('300%');
    });

    test('should return content distribution correctly', async () => {
      await Blog.create([
        { title: 'Blog 1', content: 'Content', author: 'Author', category: 'farming' },
        { title: 'Blog 2', content: 'Content', author: 'Author', category: 'livestock' }
      ]);

      await News.create([
        { title: 'News 1', content: 'News content', author: 'Author' }
      ]);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const distribution = response.body.data.contentDistribution;
      expect(distribution).toContainEqual({ name: 'Blogs', value: 2 });
      expect(distribution).toContainEqual({ name: 'News', value: 1 });
    });

    test('should return recent activities', async () => {
      // Create recent content
      await Blog.create({
        title: 'Recent Blog Post',
        content: 'Recent content',
        author: 'Author',
        category: 'farming'
      });

      await News.create({
        title: 'Recent News Item',
        content: 'Recent news',
        author: 'Author'
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const activities = response.body.data.activities;
      expect(activities).toHaveLength(2);
      expect(activities.some(activity => activity.title === 'Blog Updated')).toBe(true);
      expect(activities.some(activity => activity.title === 'News Added')).toBe(true);
    });

    test('should return popular content based on views', async () => {
      await Blog.create([
        {
          title: 'Popular Blog',
          content: 'Content',
          author: 'Author',
          category: 'farming',
          views: 1000
        },
        {
          title: 'Less Popular Blog',
          content: 'Content',
          author: 'Author',
          category: 'livestock',
          views: 100
        }
      ]);

      await News.create({
        title: 'Popular News',
        content: 'News content',
        author: 'Author',
        views: 800
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const popularContent = response.body.data.popularContent;
      expect(popularContent).toHaveLength(3);
      
      // Should be sorted by views (highest first)
      expect(popularContent[0].title).toBe('Popular Blog');
      expect(popularContent[0].views).toBe(1000);
      expect(popularContent[1].title).toBe('Popular News');
      expect(popularContent[1].views).toBe(800);
    });

    test('should return content trend for last 6 months', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const contentTrend = response.body.data.contentTrend;
      expect(contentTrend).toHaveLength(6); // Last 6 months
      
      // Each month should have the required properties
      contentTrend.forEach(month => {
        expect(month).toHaveProperty('name');
        expect(month).toHaveProperty('blogs');
        expect(month).toHaveProperty('news');
        expect(month).toHaveProperty('events');
      });
    });

    test('should calculate change percentages correctly', async () => {
      // Create some current content
      await Blog.create({
        title: 'Current Blog',
        content: 'Content',
        author: 'Author',
        category: 'farming'
      });

      await Subscriber.create({
        email: 'new@test.com',
        name: 'New Subscriber'
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const stats = response.body.data.stats;
      expect(typeof stats.totalContent.change).toBe('number');
      expect(typeof stats.subscribers.change).toBe('number');
      expect(typeof stats.engagement.change).toBe('number');
      expect(typeof stats.events.change).toBe('number');
    });

    test('should handle zero division in percentage calculations', async () => {
      // No previous data, so changes should handle zero division
      await Blog.create({
        title: 'New Blog',
        content: 'Content',
        author: 'Author',
        category: 'farming'
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const stats = response.body.data.stats;
      // Should not crash and should return reasonable values
      expect(stats.totalContent.change).toBeDefined();
      expect(stats.subscribers.change).toBeDefined();
      expect(stats.engagement.change).toBeDefined();
      expect(stats.events.change).toBeDefined();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expect(response.status).toBe(401);
    });

    test('should handle database errors gracefully', async () => {
      // Mock a database error by closing connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch dashboard statistics');

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/trial_test');
    });

    test('should return quick actions', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const quickActions = response.body.data.quickActions;
      expect(quickActions).toHaveLength(4);
      
      const actionTitles = quickActions.map(action => action.title);
      expect(actionTitles).toContain('New Blog Post');
      expect(actionTitles).toContain('Add News Item');
      expect(actionTitles).toContain('Schedule Event');
      expect(actionTitles).toContain('Send Newsletter');
    });
  });
});
