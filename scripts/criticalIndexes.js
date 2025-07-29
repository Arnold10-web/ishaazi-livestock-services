#!/usr/bin/env node

/**
 * CRITICAL DATABASE INDEXES - EMERGENCY DEPLOYMENT
 * Creates essential indexes for performance and security
 * RUN IMMEDIATELY IN PRODUCTION
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables only if not already loaded (for standalone execution)
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

const createCriticalIndexes = async () => {
  try {
    // Use existing connection if available, otherwise create new one
    if (mongoose.connection.readyState === 1) {
      console.log('🔗 Using existing MongoDB connection for critical index creation');
    } else {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔗 Connected to MongoDB for critical index creation');
    }

    const db = mongoose.connection.db;

    // CRITICAL SECURITY INDEXES
    console.log('🔒 Creating CRITICAL security indexes...');
    
    // Activity Log - for security monitoring
    await db.collection('activitylogs').createIndex(
      { action: 1, timestamp: -1 }, 
      { name: 'security_action_idx' }
    );
    
    await db.collection('activitylogs').createIndex(
      { ipAddress: 1, timestamp: -1 }, 
      { name: 'security_ip_idx' }
    );
    
    await db.collection('activitylogs').createIndex(
      { severity: 1, timestamp: -1 }, 
      { name: 'security_severity_idx' }
    );

    // User security indexes
    await db.collection('users').createIndex(
      { email: 1 }, 
      { name: 'user_email_security_idx', unique: true, sparse: true }
    );
    
    await db.collection('users').createIndex(
      { username: 1 }, 
      { name: 'user_username_security_idx', unique: true, sparse: true }
    );
    
    await db.collection('users').createIndex(
      { companyEmail: 1 }, 
      { name: 'user_company_email_idx', unique: true, sparse: true }
    );

    // CRITICAL PERFORMANCE INDEXES
    console.log('⚡ Creating CRITICAL performance indexes...');
    
    // Content search indexes
    await db.collection('blogs').createIndex(
      { title: 'text', content: 'text' }, 
      { name: 'blog_search_idx' }
    );
    
    await db.collection('news').createIndex(
      { title: 'text', content: 'text' }, 
      { name: 'news_search_idx' }
    );

    // Content filtering indexes
    await db.collection('blogs').createIndex(
      { published: 1, createdAt: -1 }, 
      { name: 'blog_published_idx' }
    );
    
    await db.collection('news').createIndex(
      { published: 1, createdAt: -1 }, 
      { name: 'news_published_idx' }
    );

    // GridFS file indexes
    await db.collection('fs.files').createIndex(
      { uploadDate: -1 }, 
      { name: 'gridfs_upload_idx' }
    );
    
    await db.collection('fs.files').createIndex(
      { filename: 1 }, 
      { name: 'gridfs_filename_idx' }
    );

    console.log('✅ ALL CRITICAL INDEXES CREATED SUCCESSFULLY!');
    console.log('🚀 Database performance and security enhanced');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR creating indexes:', error);
    // Only exit if running standalone
    if (import.meta.url === `file://${process.argv[1]}`) {
      process.exit(1);
    } else {
      throw error; // Let the caller handle the error
    }
  } finally {
    // Only disconnect if we created the connection (standalone execution)
    if (import.meta.url === `file://${process.argv[1]}`) {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createCriticalIndexes();
}

export { createCriticalIndexes as runCriticalIndexes };
export default createCriticalIndexes;
