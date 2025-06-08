import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import News from '../models/News.js';

describe('News Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await News.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid news article', async () => {
      const validNews = {
        title: 'Test News Article',
        content: 'This is a test news article content.',
        author: 'Test Author',
        category: 'agriculture',
        image: 'test-image.jpg',
        published: true
      };

      const news = new News(validNews);
      const savedNews = await news.save();

      expect(savedNews._id).toBeDefined();
      expect(savedNews.title).toBe(validNews.title);
      expect(savedNews.content).toBe(validNews.content);
      expect(savedNews.author).toBe(validNews.author);
      expect(savedNews.category).toBe(validNews.category);
      expect(savedNews.published).toBe(true);
    });

    it('should require title', async () => {
      const news = new News({
        content: 'Test content',
        author: 'Test Author'
      });

      let err;
      try {
        await news.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.title).toBeDefined();
    });

    it('should require content', async () => {
      const news = new News({
        title: 'Test Title',
        author: 'Test Author'
      });

      let err;
      try {
        await news.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.content).toBeDefined();
    });

    it('should require author', async () => {
      const news = new News({
        title: 'Test Title',
        content: 'Test content'
      });

      let err;
      try {
        await news.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.author).toBeDefined();
    });

    it('should set default published to false', async () => {
      const news = new News({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author'
      });

      const savedNews = await news.save();
      expect(savedNews.published).toBe(false);
    });

    it('should validate category enum values', async () => {
      const news = new News({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author',
        category: 'invalid-category'
      });

      let err;
      try {
        await news.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.category).toBeDefined();
    });

    it('should accept valid category values', async () => {
      const validCategories = ['agriculture', 'livestock', 'technology', 'market', 'general'];
      
      for (const category of validCategories) {
        const news = new News({
          title: `Test Title ${category}`,
          content: 'Test content',
          author: 'Test Author',
          category: category
        });

        const savedNews = await news.save();
        expect(savedNews.category).toBe(category);
      }
    });

    it('should handle tags array', async () => {
      const news = new News({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author',
        tags: ['farming', 'organic', 'sustainable']
      });

      const savedNews = await news.save();
      expect(savedNews.tags).toEqual(['farming', 'organic', 'sustainable']);
      expect(savedNews.tags.length).toBe(3);
    });

    it('should handle empty tags array', async () => {
      const news = new News({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author',
        tags: []
      });

      const savedNews = await news.save();
      expect(savedNews.tags).toEqual([]);
    });
  });

  describe('Timestamps and Dates', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const news = await News.create({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author'
      });

      expect(news.createdAt).toBeDefined();
      expect(news.updatedAt).toBeDefined();
      expect(news.createdAt).toBeInstanceOf(Date);
      expect(news.updatedAt).toBeInstanceOf(Date);
    });

    it('should set publishedAt when published is true', async () => {
      const news = await News.create({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author',
        published: true
      });

      expect(news.publishedAt).toBeDefined();
      expect(news.publishedAt).toBeInstanceOf(Date);
    });

    it('should not set publishedAt when published is false', async () => {
      const news = await News.create({
        title: 'Test Title',
        content: 'Test content',
        author: 'Test Author',
        published: false
      });

      expect(news.publishedAt).toBeUndefined();
    });
  });

  describe('Search and Indexing', () => {
    it('should allow searching by title', async () => {
      await News.create({
        title: 'Agricultural Innovation',
        content: 'Content about agriculture',
        author: 'Test Author'
      });

      await News.create({
        title: 'Livestock Management',
        content: 'Content about livestock',
        author: 'Test Author'
      });

      const results = await News.find({ 
        title: { $regex: 'Agricultural', $options: 'i' } 
      });

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Agricultural Innovation');
    });

    it('should allow searching by content', async () => {
      await News.create({
        title: 'Test Title 1',
        content: 'This article discusses sustainable farming practices',
        author: 'Test Author'
      });

      await News.create({
        title: 'Test Title 2',
        content: 'This article is about livestock breeding',
        author: 'Test Author'
      });

      const results = await News.find({ 
        content: { $regex: 'sustainable', $options: 'i' } 
      });

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Test Title 1');
    });

    it('should allow filtering by category', async () => {
      await News.create({
        title: 'Agriculture News',
        content: 'Content',
        author: 'Test Author',
        category: 'agriculture'
      });

      await News.create({
        title: 'Livestock News',
        content: 'Content',
        author: 'Test Author',
        category: 'livestock'
      });

      const results = await News.find({ category: 'agriculture' });

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Agriculture News');
    });

    it('should allow filtering by published status', async () => {
      await News.create({
        title: 'Published News',
        content: 'Content',
        author: 'Test Author',
        published: true
      });

      await News.create({
        title: 'Draft News',
        content: 'Content',
        author: 'Test Author',
        published: false
      });

      const publishedResults = await News.find({ published: true });
      const draftResults = await News.find({ published: false });

      expect(publishedResults.length).toBe(1);
      expect(draftResults.length).toBe(1);
      expect(publishedResults[0].title).toBe('Published News');
      expect(draftResults[0].title).toBe('Draft News');
    });
  });
});
