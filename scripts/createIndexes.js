#!/usr/bin/env node

/**
 * Database Indexing Script for Performance Optimization
 * Creates indexes for search fields across all content collections
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trial';

async function createIndexes() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database');

    // Define collections that need indexing
    const collections = ['blogs', 'news', 'dairies', 'beefs', 'goats', 'piggeries'];
    
    console.log('\n📊 Creating indexes for performance optimization...\n');

    for (const collectionName of collections) {
      console.log(`Processing ${collectionName} collection...`);
      const collection = db.collection(collectionName);

      try {
        // Check if collection exists
        const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
        if (!collectionExists) {
          console.log(`⚠️  Collection ${collectionName} does not exist, skipping...`);
          continue;
        }

        // Text search index for title, content, and description
        await collection.createIndex(
          {
            title: 'text',
            content: 'text',
            description: 'text',
            summary: 'text'
          },
          {
            name: 'text_search_index',
            background: true,
            weights: {
              title: 10,
              description: 8,
              summary: 6,
              content: 1
            }
          }
        );
        console.log(`  ✅ Text search index created for ${collectionName}`);

        // Category index for filtering
        await collection.createIndex(
          { category: 1 },
          { name: 'category_index', background: true }
        );
        console.log(`  ✅ Category index created for ${collectionName}`);

        // Tags array index for tag filtering
        await collection.createIndex(
          { tags: 1 },
          { name: 'tags_index', background: true }
        );
        console.log(`  ✅ Tags index created for ${collectionName}`);

        // Date index for sorting by newest/oldest
        await collection.createIndex(
          { createdAt: -1 },
          { name: 'date_desc_index', background: true }
        );
        console.log(`  ✅ Date descending index created for ${collectionName}`);

        // Compound index for category + date
        await collection.createIndex(
          { category: 1, createdAt: -1 },
          { name: 'category_date_index', background: true }
        );
        console.log(`  ✅ Category + Date compound index created for ${collectionName}`);

        // Status index (for published/draft filtering)
        await collection.createIndex(
          { status: 1 },
          { name: 'status_index', background: true }
        );
        console.log(`  ✅ Status index created for ${collectionName}`);

        // Featured content index
        await collection.createIndex(
          { featured: 1, createdAt: -1 },
          { name: 'featured_date_index', background: true }
        );
        console.log(`  ✅ Featured + Date index created for ${collectionName}`);

        console.log(`  🎯 All indexes created for ${collectionName}\n`);

      } catch (error) {
        console.error(`  ❌ Error creating indexes for ${collectionName}:`, error.message);
      }
    }

    // Create compound search index across all collections
    console.log('🔍 Creating search analytics collection and indexes...');
    
    const searchAnalytics = db.collection('searchAnalytics');
    
    // Index for search analytics
    await searchAnalytics.createIndex(
      { searchTerm: 1, timestamp: -1 },
      { name: 'search_analytics_index', background: true }
    );
    console.log('  ✅ Search analytics index created');

    await searchAnalytics.createIndex(
      { timestamp: -1 },
      { name: 'timestamp_index', background: true }
    );
    console.log('  ✅ Timestamp index created for analytics');

    // Create index for user preferences/search history
    const userSearchHistory = db.collection('userSearchHistory');
    await userSearchHistory.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'user_search_history_index', background: true }
    );
    console.log('  ✅ User search history index created');

    console.log('\n🎉 All database indexes created successfully!');
    console.log('📈 Search performance should now be significantly improved.');

    // Display created indexes for verification
    console.log('\n📋 Index Summary:');
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        console.log(`\n${collectionName} (${indexes.length} indexes):`);
        indexes.forEach(index => {
          console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
      } catch (error) {
        console.log(`  Error listing indexes for ${collectionName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 Database connection closed');
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createIndexes()
    .then(() => {
      console.log('\n✨ Database optimization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default createIndexes;
