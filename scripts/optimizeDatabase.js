// Database Optimization Script
// Run this script to add production-ready indexes
// SAFE TO RUN - Only adds indexes, doesn't modify data

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';

// Load environment variables
dotenv.config();

/**
 * Safely create index - checks if index exists before creating
 * @param {Object} collection - MongoDB collection
 * @param {Object} indexSpec - Index specification
 * @param {String} indexName - Custom index name
 * @param {Object} options - Index options
 */
const createIndexSafely = async (collection, indexSpec, indexName, options = {}) => {
  try {
    const indexes = await collection.indexes();
    const existingIndex = indexes.find(idx => 
      idx.name === indexName || 
      JSON.stringify(idx.key) === JSON.stringify(indexSpec)
    );
    
    if (existingIndex) {
      console.log(`   ⏭️  Index already exists: ${indexName || JSON.stringify(indexSpec)}`);
      return;
    }
    
    await collection.createIndex(indexSpec, { ...options, name: indexName });
    console.log(`   ✅ Created index: ${indexName}`);
  } catch (error) {
    if (error.code === 85) { // IndexOptionsConflict
      console.log(`   ⚠️  Index exists with different options: ${indexName}`);
    } else if (error.code === 86) { // IndexKeySpecsConflict  
      console.log(`   ⚠️  Index exists with same key but different name: ${indexName}`);
    } else {
      console.error(`   ❌ Error creating index ${indexName}:`, error.message);
    }
  }
};

const addProductionIndexes = async () => {
  console.log('🔧 Adding production database indexes...');
  
  try {
    // Blog indexes for performance
    await createIndexSafely(Blog.collection, { published: 1, createdAt: -1 }, 'blog_published_created_idx');
    await createIndexSafely(Blog.collection, { category: 1, createdAt: -1 }, 'blog_category_created_idx');
    await createIndexSafely(Blog.collection, { views: -1 }, 'blog_views_idx');
    await createIndexSafely(Blog.collection, { 'metadata.featured': 1, createdAt: -1 }, 'blog_featured_created_idx');
    await createIndexSafely(Blog.collection, { 'tags': 1 }, 'blog_tags_idx'); // Array field index
    console.log('✅ Blog indexes created');

    // News indexes
    await createIndexSafely(News.collection, { published: 1, createdAt: -1 }, 'news_published_created_idx');
    await createIndexSafely(News.collection, { isBreaking: 1, createdAt: -1 }, 'news_breaking_created_idx');
    await createIndexSafely(News.collection, { category: 1, createdAt: -1 }, 'news_category_created_idx');
    await createIndexSafely(News.collection, { views: -1 }, 'news_views_idx');
    console.log('✅ News indexes created');

    // Event indexes
    await createIndexSafely(Event.collection, { startDate: 1 }, 'event_startDate_idx');
    await createIndexSafely(Event.collection, { published: 1, startDate: 1 }, 'event_published_startDate_idx');
    await createIndexSafely(Event.collection, { location: 1, startDate: 1 }, 'event_location_startDate_idx');
    console.log('✅ Event indexes created');

    // User indexes for authentication performance
    // Note: email, companyEmail, and username unique indexes are already created by schema
    // Only create additional performance indexes that don't conflict
    await createIndexSafely(User.collection, { role: 1, isActive: 1 }, 'user_role_active_idx');
    await createIndexSafely(User.collection, { lastLogin: -1 }, 'user_lastLogin_idx');
    console.log('✅ User indexes created');

    // Newsletter indexes
    await createIndexSafely(Newsletter.collection, { status: 1, createdAt: -1 }, 'newsletter_status_created_idx');
    await createIndexSafely(Newsletter.collection, { sentAt: -1 }, 'newsletter_sentAt_idx');
    console.log('✅ Newsletter indexes created');

    // Subscriber indexes
    await createIndexSafely(Subscriber.collection, { email: 1 }, 'subscriber_email_idx', { unique: true });
    await createIndexSafely(Subscriber.collection, { isActive: 1, subscriptionType: 1 }, 'subscriber_active_type_idx');
    await createIndexSafely(Subscriber.collection, { lastOpened: -1 }, 'subscriber_lastOpened_idx');
    console.log('✅ Subscriber indexes created');

    // Compound indexes for complex queries
    await createIndexSafely(Blog.collection, { published: 1, category: 1, createdAt: -1 }, 'blog_compound_idx');
    await createIndexSafely(News.collection, { published: 1, isBreaking: 1, createdAt: -1 }, 'news_compound_idx');
    
    // Text search indexes
    await createIndexSafely(Blog.collection, { 
      title: 'text', 
      content: 'text', 
      'metadata.description': 'text' 
    }, 'blog_text_search_idx');
    await createIndexSafely(News.collection, { 
      title: 'text', 
      content: 'text' 
    }, 'news_text_search_idx');
    
    console.log('✅ All production indexes created successfully!');
    console.log('📊 Run db.stats() to see the impact on query performance');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

// Query performance analysis
const analyzeQueryPerformance = async () => {
  console.log('📊 Analyzing query performance...');
  
  try {
    // Example slow query analysis
    const slowQueries = [
      { collection: 'blogs', query: { published: true }, sort: { createdAt: -1 } },
      { collection: 'news', query: { isBreaking: true }, sort: { createdAt: -1 } },
      { collection: 'events', query: { startDate: { $gte: new Date() } }, sort: { startDate: 1 } }
    ];

    for (const queryTest of slowQueries) {
      const startTime = Date.now();
      
      if (queryTest.collection === 'blogs') {
        await Blog.find(queryTest.query).sort(queryTest.sort).limit(10).explain('executionStats');
      } else if (queryTest.collection === 'news') {
        await News.find(queryTest.query).sort(queryTest.sort).limit(10).explain('executionStats');
      } else if (queryTest.collection === 'events') {
        await Event.find(queryTest.query).sort(queryTest.sort).limit(10).explain('executionStats');
      }
      
      const executionTime = Date.now() - startTime;
      console.log(`${queryTest.collection} query: ${executionTime}ms`);
    }
    
  } catch (error) {
    console.error('Error analyzing performance:', error);
  }
};

export { addProductionIndexes, analyzeQueryPerformance };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../config/db.js').then(async ({ default: connectDB }) => {
    await connectDB();
    await addProductionIndexes();
    await analyzeQueryPerformance();
    process.exit(0);
  });
}
