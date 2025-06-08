// addTags.js - Script to add sample tags to blog posts
import mongoose from 'mongoose';
import Blog from './models/Blog.js';
import Dairy from './models/Dairy.js';
import Beef from './models/Beef.js';
import Goat from './models/Goat.js';
import Piggery from './models/Piggery.js';
import News from './models/News.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define sample tags for each content type
const tagsByContentType = {
  blog: ['farming', 'agriculture', 'crops', 'livestock', 'organic', 'sustainable'],
  news: ['market', 'prices', 'weather', 'policy', 'regulations', 'innovation'],
  dairy: ['milk', 'cheese', 'yogurt', 'cattle', 'production', 'processing'],
  beef: ['cattle', 'pasture', 'breeds', 'meat', 'grazing', 'feed'],
  goat: ['milk', 'meat', 'breeds', 'management', 'health', 'nutrition'],
  piggery: ['breeds', 'housing', 'feeding', 'production', 'health', 'management']
};

// Connect to MongoDB
const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/trial';
console.log('Connecting to MongoDB at:', dbUrl);

async function addTags() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Update each content type with its respective tags
    const updatePromises = [
      updateContentTypeTags(Blog, 'blog', tagsByContentType.blog),
      updateContentTypeTags(News, 'news', tagsByContentType.news),
      updateContentTypeTags(Dairy, 'dairy', tagsByContentType.dairy),
      updateContentTypeTags(Beef, 'beef', tagsByContentType.beef),
      updateContentTypeTags(Goat, 'goat', tagsByContentType.goat),
      updateContentTypeTags(Piggery, 'piggery', tagsByContentType.piggery)
    ];

    await Promise.all(updatePromises);
    
    console.log('All content types updated with tags');

  } catch (error) {
    console.error('Error adding tags:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

async function updateContentTypeTags(Model, contentType, tags) {
  try {
    // Get all documents for this content type
    const documents = await Model.find({});
    console.log(`Found ${documents.length} ${contentType} documents`);

    if (documents.length === 0) {
      console.log(`No ${contentType} documents found to update`);
      return;
    }

    // Update each document with a random selection of tags
    const updatePromises = documents.map(async (doc) => {
      // Select 2-4 random tags from the tag list
      const numTags = Math.floor(Math.random() * 3) + 2; // random number between 2 and 4
      const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
      const selectedTags = shuffledTags.slice(0, numTags);
      
      // Update the document
      doc.tags = selectedTags;
      return doc.save();
    });

    await Promise.all(updatePromises);
    console.log(`Updated ${updatePromises.length} ${contentType} documents with tags`);

  } catch (error) {
    console.error(`Error updating ${contentType}:`, error);
  }
}

// Run the function
addTags();
