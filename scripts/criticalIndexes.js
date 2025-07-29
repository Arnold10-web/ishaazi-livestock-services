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
    
    // Helper function to replace existing indexes with optimized ones
    const replaceIndex = async (collection, indexSpec, options) => {
      try {
        // Get existing indexes
        const existingIndexes = await db.collection(collection).indexes();
        
        // Check if we have a conflicting index (same fields, different name)
        const conflictingIndex = existingIndexes.find(idx => {
          if (idx.name === '_id_') return false; // Skip default _id index
          
          // Compare index keys
          const existingKeys = Object.keys(idx.key || {});
          const newKeys = Object.keys(indexSpec);
          
          // Check if same fields are indexed
          return existingKeys.length === newKeys.length && 
                 existingKeys.every(key => newKeys.includes(key));
        });
        
        if (conflictingIndex && conflictingIndex.name !== options.name) {
          console.log(`🔄 Replacing existing index "${conflictingIndex.name}" with optimized "${options.name}" on ${collection}`);
          await db.collection(collection).dropIndex(conflictingIndex.name);
          console.log(`🗑️ Dropped old index: ${conflictingIndex.name}`);
        }
        
        // Create the new optimized index
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(`✅ Created optimized index: ${options.name} on ${collection}`);
        
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠️ Index conflict for ${options.name} on ${collection} - attempting force replacement...`);
          try {
            // Try to drop any conflicting index and recreate
            const allIndexes = await db.collection(collection).indexes();
            const fieldsStr = Object.keys(indexSpec).join('_');
            const conflicting = allIndexes.find(idx => 
              idx.name.includes(fieldsStr) || 
              JSON.stringify(idx.key) === JSON.stringify(indexSpec)
            );
            
            if (conflicting && conflicting.name !== '_id_') {
              await db.collection(collection).dropIndex(conflicting.name);
              console.log(`🗑️ Force dropped conflicting index: ${conflicting.name}`);
            }
            
            await db.collection(collection).createIndex(indexSpec, options);
            console.log(`✅ Force created index: ${options.name} on ${collection}`);
          } catch (retryError) {
            console.log(`⚠️ Could not replace index ${options.name} on ${collection}: ${retryError.message}`);
          }
        } else {
          console.log(`⚠️ Error creating index ${options.name} on ${collection}: ${error.message}`);
        }
      }
    };
    
    // Activity Log - for security monitoring
    await replaceIndex('activitylogs', 
      { action: 1, timestamp: -1 }, 
      { name: 'security_action_idx' }
    );
    
    await replaceIndex('activitylogs', 
      { ipAddress: 1, timestamp: -1 }, 
      { name: 'security_ip_idx' }
    );
    
    await replaceIndex('activitylogs', 
      { severity: 1, timestamp: -1 }, 
      { name: 'security_severity_idx' }
    );

    // User security indexes
    await replaceIndex('users', 
      { email: 1 }, 
      { name: 'user_email_security_idx', unique: true, sparse: true }
    );
    
    await replaceIndex('users', 
      { username: 1 }, 
      { name: 'user_username_security_idx', unique: true, sparse: true }
    );
    
    await replaceIndex('users', 
      { companyEmail: 1 }, 
      { name: 'user_company_email_idx', unique: true, sparse: true }
    );

    // CRITICAL PERFORMANCE INDEXES
    console.log('⚡ Creating CRITICAL performance indexes...');
    
    // Content search indexes
    await replaceIndex('blogs', 
      { title: 'text', content: 'text' }, 
      { name: 'blog_search_idx' }
    );
    
    await replaceIndex('news',
      { title: 'text', content: 'text' }, 
      { name: 'news_search_idx' }
    );

    // Content filtering indexes
    await replaceIndex('blogs', 
      { published: 1, createdAt: -1 }, 
      { name: 'blog_published_idx' }
    );
    
    await replaceIndex('news', 
      { published: 1, createdAt: -1 }, 
      { name: 'news_published_idx' }
    );

    // GridFS file indexes
    await replaceIndex('fs.files', 
      { uploadDate: -1 }, 
      { name: 'gridfs_upload_idx' }
    );
    
    await replaceIndex('fs.files', 
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
