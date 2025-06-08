import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog.js';
import News from './models/News.js';

dotenv.config();

async function resetViewCounts() {
  try {
    // Connect using your .env configuration
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB database:', process.env.MONGO_URI);
    
    // Get current view counts
    console.log('\n=== CURRENT VIEW COUNTS ===');
    
    const blogs = await Blog.find({}).sort({ views: -1 }).limit(10);
    console.log('\nBlogs:');
    blogs.forEach((blog, index) => {
      console.log(`${index + 1}. ${blog.title}`);
      console.log(`   Current Views: ${blog.views || 0}`);
    });
    
    const news = await News.find({}).sort({ views: -1 }).limit(10);
    console.log('\nNews:');
    news.forEach((newsItem, index) => {
      console.log(`${index + 1}. ${newsItem.title}`);
      console.log(`   Current Views: ${newsItem.views || 0}`);
    });
    
    // Ask user if they want to reset
    console.log('\n=== RESET OPTIONS ===');
    console.log('This will reset all view counts to realistic development values (1-5 views)');
    console.log('Run this script with --reset flag to actually perform the reset');
    
    if (process.argv.includes('--reset')) {
      console.log('\nResetting view counts...');
      
      // Reset blogs to random low values (1-5)
      const blogUpdates = await Blog.updateMany({}, [
        {
          $set: {
            views: { $floor: { $add: [{ $multiply: [{ $rand: {} }, 5] }, 1] } }
          }
        }
      ]);
      
      // Reset news to random low values (1-5)
      const newsUpdates = await News.updateMany({}, [
        {
          $set: {
            views: { $floor: { $add: [{ $multiply: [{ $rand: {} }, 5] }, 1] } }
          }
        }
      ]);
      
      console.log(`Updated ${blogUpdates.modifiedCount} blogs`);
      console.log(`Updated ${newsUpdates.modifiedCount} news items`);
      
      // Show new counts
      console.log('\n=== NEW VIEW COUNTS ===');
      const newBlogs = await Blog.find({}).sort({ views: -1 }).limit(5);
      newBlogs.forEach((blog, index) => {
        console.log(`${index + 1}. ${blog.title} - ${blog.views} views`);
      });
      
      const newNews = await News.find({}).sort({ views: -1 }).limit(5);
      newNews.forEach((newsItem, index) => {
        console.log(`${index + 1}. ${newsItem.title} - ${newsItem.views} views`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetViewCounts();
