const mongoose = require('mongoose');

async function checkViewCounts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/trial');
    console.log('Connected to MongoDB database: trial');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check blogs collection
    if (collections.some(c => c.name === 'blogs')) {
      console.log('\n=== BLOG VIEW COUNTS ===');
      const blogs = await mongoose.connection.db.collection('blogs').find({}).sort({ views: -1 }).limit(10).toArray();
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. ${blog.title}`);
        console.log(`   Views: ${blog.views || 0}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log('');
      });
    }
    
    // Check news collection  
    if (collections.some(c => c.name === 'news')) {
      console.log('\n=== NEWS VIEW COUNTS ===');
      const news = await mongoose.connection.db.collection('news').find({}).sort({ views: -1 }).limit(10).toArray();
      news.forEach((newsItem, index) => {
        console.log(`${index + 1}. ${newsItem.title}`);
        console.log(`   Views: ${newsItem.views || 0}`);
        console.log(`   Created: ${newsItem.createdAt}`);
        console.log('');
      });
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkViewCounts();
