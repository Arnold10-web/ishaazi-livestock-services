import express from 'express';
import { getBlogRSSFeed, getNewsRSSFeed, getAllContentRSSFeed, generateSitemap } from '../controllers/syndicationController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// RSS Feed Routes
router.get('/rss/blogs', cacheMiddleware(3600), getBlogRSSFeed); // Cache for 1 hour
router.get('/rss/news', cacheMiddleware(3600), getNewsRSSFeed);
router.get('/rss/all', cacheMiddleware(3600), getAllContentRSSFeed);

// Sitemap Routes
router.get('/sitemap.xml', cacheMiddleware(86400), generateSitemap); // Cache for 24 hours

export default router;
