/**
 * Simple Blog Update Test
 * 
 * This script performs a targeted test of blog update functionality
 * with a focus on properly handling tags.
 */

import axios from 'axios';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };

// Helper to log with colors
const log = {
  info: msg => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: msg => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: msg => console.log(`\x1b[31m${msg}\x1b[0m`),
  warning: msg => console.log(`\x1b[33m${msg}\x1b[0m`),
  divider: () => console.log('\n' + '-'.repeat(80) + '\n')
};

// Delay helper to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  log.divider();
  log.info('STARTING BLOG UPDATE TEST');
  log.divider();

  // Step 1: Login
  log.info('Logging in...');
  let token;
  try {
    const response = await axios.post(`${API_BASE}/admin/login`, AUTH);
    token = response.data.token;
    log.success('✅ Login successful');
  } catch (error) {
    log.error(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    return;
  }

  // Wait to avoid rate limiting
  await delay(1000);

  // Step 2: Create a test blog
  log.info('Creating test blog...');
  let blogId;
  
  try {
    const formData = new FormData();
    formData.append('title', `Test Blog ${new Date().toISOString().slice(0, 16)}`);
    formData.append('content', '<p>Test content for blog update testing</p>');
    formData.append('author', 'Test Author');
    formData.append('category', 'Technology');
    formData.append('tags', JSON.stringify(['test', 'tags', 'initial']));
    formData.append('published', 'true');

    const response = await axios.post(`${API_BASE}/content/blogs`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    blogId = response.data.data?._id || response.data._id;
    log.success(`✅ Blog created with ID: ${blogId}`);
    
    // Log the full response for debugging
    console.log('Create response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    log.error(`❌ Blog creation failed: ${error.response?.data?.message || error.message}`);
    console.log('Error details:', error.response?.data);
    return;
  }

  // Wait to avoid rate limiting
  await delay(1000);

  // Step 3: Update the blog with new tags as a JSON string
  log.info('Updating blog with JSON string tags...');
  
  try {
    const formData = new FormData();
    formData.append('title', 'Updated Title - JSON String Tags');
    
    // Send tags as a JSON string
    const jsonTags = JSON.stringify(['updated', 'json', 'tags']);
    formData.append('tags', jsonTags);
    
    // Log what we're sending
    console.log('Sending tags as JSON string:', jsonTags);
    formData.append('published', 'true');

    const response = await axios.put(`${API_BASE}/content/blogs/${blogId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    log.success('✅ Update with JSON string tags successful');
    console.log('Update response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    log.error(`❌ Update with JSON string tags failed: ${error.response?.data?.message || error.message}`);
    console.log('Error details:', error.response?.data);
    console.log('Request payload:', {
      title: 'Updated Title - JSON String Tags',
      tags: JSON.stringify(['updated', 'json', 'tags']),
      published: 'true'
    });
  }

  // Wait to avoid rate limiting
  await delay(1000);

  // Step 4: Verify by getting the updated blog
  log.info(`Retrieving updated blog (ID: ${blogId})...`);
  
  try {
    const response = await axios.get(`${API_BASE}/content/blogs/${blogId}`);
    log.success('✅ Blog retrieved successfully');
    console.log('Retrieved blog data:', JSON.stringify(response.data, null, 2));
    
    // Check if tags were updated correctly
    const retrievedTags = response.data.tags || [];
    console.log('Retrieved tags:', retrievedTags);
    
    if (retrievedTags.includes('updated') && retrievedTags.includes('json') && retrievedTags.includes('tags')) {
      log.success('✅ Tag update verified successfully!');
    } else {
      log.error('❌ Tags were not updated correctly');
    }
  } catch (error) {
    log.error(`❌ Failed to retrieve blog: ${error.response?.data?.message || error.message}`);
  }

  log.divider();
  log.info('TEST COMPLETE');
  log.divider();
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
});
