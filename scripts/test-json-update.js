/**
 * Blog Update JSON Test
 * 
 * This script tests updating a blog using direct JSON instead of FormData.
 */
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };

// Helper to delay execution to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testJsonUpdate() {
  console.log('Testing blog update with direct JSON...');
  
  // Step 1: Login
  const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
  const token = loginResponse.data.token;
  console.log('Login successful');
  
  // Wait to avoid rate limits
  console.log('Waiting 5 seconds to avoid rate limits...');
  await delay(5000);
  
  // Step 2: Create a test blog
  const createData = {
    title: 'Test Blog for JSON Update',
    content: '<p>Test content</p>',
    author: 'Test Author',
    category: 'Technology',
    tags: ['initial', 'test'],
    published: true
  };
  
  const createConfig = {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const createResponse = await axios.post(`${API_URL}/content/blogs`, createData, createConfig);
  const blogId = createResponse.data.data?._id || createResponse.data._id;
  console.log(`Created blog with ID: ${blogId}`);
  console.log('Create response:', createResponse.data);
  
  // Wait to avoid rate limits
  console.log('Waiting 5 seconds to avoid rate limits...');
  await delay(5000);
  
  // Step 3: Update using JSON
  const updateData = {
    title: 'Updated Blog Title via JSON',
    tags: ['updated', 'json', 'test'],
    published: true
  };
  
  try {
    const updateResponse = await axios.put(`${API_URL}/content/blogs/${blogId}`, updateData, createConfig);
    console.log('Update successful!');
    console.log('Update response:', updateResponse.data);
  } catch (error) {
    console.error('Update failed!');
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
  
  // Step 4: Verify the update
  try {
    const getResponse = await axios.get(`${API_URL}/content/blogs/${blogId}`);
    console.log('\nRetrieved updated blog:');
    console.log('Title:', getResponse.data.data.title);
    console.log('Tags:', getResponse.data.data.tags);
  } catch (error) {
    console.error('Failed to retrieve updated blog');
    console.error(error.message);
  }
}

testJsonUpdate().catch(err => console.error('Unhandled error:', err));
