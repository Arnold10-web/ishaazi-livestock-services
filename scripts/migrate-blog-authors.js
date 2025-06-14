/**
 * Migration Script: Add Author field to Blog documents
 * 
 * This script updates all existing blog documents to ensure they have an author field.
 * It extracts the author from the metadata object if available, or uses "Unknown Author"
 * as a fallback.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from '../models/Blog.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for migration'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Migration function to add author field to all blogs
 */
async function migrateBlogAuthors() {
  try {
    console.log('Starting blog author migration...');
    
    // Get all blogs
    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} blogs to process`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each blog
    for (const blog of blogs) {
      // Skip if already has author field
      if (blog.author) {
        skipped++;
        continue;
      }
      
      // Extract author from metadata if available
      let author = 'Unknown Author';
      
      if (blog.metadata && blog.metadata.author) {
        author = blog.metadata.author;
      }
      
      // Update the blog document
      blog.author = author;
      await blog.save();
      updated++;
      
      // Log progress every 10 blogs
      if (updated % 10 === 0) {
        console.log(`Processed ${updated} blogs...`);
      }
    }
    
    console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateBlogAuthors();
