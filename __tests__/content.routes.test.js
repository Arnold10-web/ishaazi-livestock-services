import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import contentRoutes from '../routes/contentRoutes.js';
import Admin from '../models/Admin.js';
import News from '../models/News.js';
import Blog from '../models/Blog.js';

const app = express();
app.use(express.json());
app.use('/api/content', contentRoutes);

describe('Content Routes Test', () => {
  let mongoServer;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await Admin.create({
      username: 'testadmin',
      email: 'test@admin.com',
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
    // Clean up test data except the admin user
    await News.deleteMany({});
    await Blog.deleteMany({});
  });

  describe('News Routes', () => {
    describe('GET /api/content/news', () => {
      beforeEach(async () => {
        // Create test news articles
        await News.create([
          {
            title: 'Published News 1',
            content: 'Content 1',
            author: 'Author 1',
            published: true,
            category: 'agriculture'
          },
          {
            title: 'Published News 2',
            content: 'Content 2',
            author: 'Author 2',
            published: true,
            category: 'livestock'
          },
          {
            title: 'Draft News',
            content: 'Draft Content',
            author: 'Author 3',
            published: false,
            category: 'technology'
          }
        ]);
      });

      it('should get all published news articles', async () => {
        const response = await request(app)
          .get('/api/content/news');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news).toBeDefined();
        expect(response.body.news.length).toBe(2); // Only published articles
        expect(response.body.news.every(article => article.published)).toBe(true);
      });

      it('should get all news articles (including drafts) for authenticated admin', async () => {
        const response = await request(app)
          .get('/api/content/news?includeDrafts=true')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news).toBeDefined();
        expect(response.body.news.length).toBe(3); // All articles including drafts
      });

      it('should filter news by category', async () => {
        const response = await request(app)
          .get('/api/content/news?category=agriculture');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news.length).toBe(1);
        expect(response.body.news[0].category).toBe('agriculture');
      });

      it('should paginate news results', async () => {
        const response = await request(app)
          .get('/api/content/news?page=1&limit=1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news.length).toBe(1);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalPages).toBeGreaterThan(0);
      });

      it('should search news by title', async () => {
        const response = await request(app)
          .get('/api/content/news?search=Published News 1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news.length).toBe(1);
        expect(response.body.news[0].title).toContain('Published News 1');
      });
    });

    describe('GET /api/content/news/:id', () => {
      let newsArticle;

      beforeEach(async () => {
        newsArticle = await News.create({
          title: 'Test News Article',
          content: 'Test content',
          author: 'Test Author',
          published: true,
          category: 'agriculture'
        });
      });

      it('should get single news article by ID', async () => {
        const response = await request(app)
          .get(`/api/content/news/${newsArticle._id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news).toBeDefined();
        expect(response.body.news._id).toBe(newsArticle._id.toString());
        expect(response.body.news.title).toBe('Test News Article');
      });

      it('should return 404 for non-existent news article', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/content/news/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 for invalid ID format', async () => {
        const response = await request(app)
          .get('/api/content/news/invalid-id');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/content/news', () => {
      it('should create new news article with authentication', async () => {
        const newsData = {
          title: 'New News Article',
          content: 'New content for the article',
          author: 'Test Author',
          category: 'agriculture',
          tags: ['farming', 'organic'],
          published: true
        };

        const response = await request(app)
          .post('/api/content/news')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newsData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.news).toBeDefined();
        expect(response.body.news.title).toBe(newsData.title);
        expect(response.body.news.content).toBe(newsData.content);
        expect(response.body.news.tags).toEqual(newsData.tags);
      });

      it('should reject creation without authentication', async () => {
        const newsData = {
          title: 'New News Article',
          content: 'New content',
          author: 'Test Author'
        };

        const response = await request(app)
          .post('/api/content/news')
          .send(newsData);

        expect(response.status).toBe(401);
      });

      it('should reject creation with missing required fields', async () => {
        const newsData = {
          title: 'Incomplete Article'
          // Missing content and author
        };

        const response = await request(app)
          .post('/api/content/news')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newsData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should create draft article by default', async () => {
        const newsData = {
          title: 'Draft Article',
          content: 'Draft content',
          author: 'Test Author'
        };

        const response = await request(app)
          .post('/api/content/news')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newsData);

        expect(response.status).toBe(201);
        expect(response.body.news.published).toBe(false);
      });
    });

    describe('PUT /api/content/news/:id', () => {
      let newsArticle;

      beforeEach(async () => {
        newsArticle = await News.create({
          title: 'Original Title',
          content: 'Original content',
          author: 'Original Author',
          published: false
        });
      });

      it('should update news article with authentication', async () => {
        const updateData = {
          title: 'Updated Title',
          content: 'Updated content',
          published: true
        };

        const response = await request(app)
          .put(`/api/content/news/${newsArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.news.title).toBe('Updated Title');
        expect(response.body.news.content).toBe('Updated content');
        expect(response.body.news.published).toBe(true);
      });

      it('should reject update without authentication', async () => {
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/api/content/news/${newsArticle._id}`)
          .send(updateData);

        expect(response.status).toBe(401);
      });

      it('should return 404 for non-existent article', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/api/content/news/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/content/news/:id', () => {
      let newsArticle;

      beforeEach(async () => {
        newsArticle = await News.create({
          title: 'Article to Delete',
          content: 'Content to delete',
          author: 'Test Author'
        });
      });

      it('should delete news article with authentication', async () => {
        const response = await request(app)
          .delete(`/api/content/news/${newsArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify article is deleted
        const deletedArticle = await News.findById(newsArticle._id);
        expect(deletedArticle).toBeNull();
      });

      it('should reject deletion without authentication', async () => {
        const response = await request(app)
          .delete(`/api/content/news/${newsArticle._id}`);

        expect(response.status).toBe(401);
      });

      it('should return 404 for non-existent article', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/content/news/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily close the database connection
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/content/news');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/content/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});
