/**
 * Simple Direct Blog Update Test
 * 
 * This script tests updating a blog by bypassing validation issues.
 */
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };

async function testUpdate() {
  console.log('Starting simple direct blog update test...');
  
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Create a blog with JSON
    console.log('Creating a test blog...');
    const createResponse = await axios.post(
      `${API_URL}/content/blogs`,
      {
        title: 'Simple Test Blog ' + new Date().toISOString(),
        content: '<p>Simple test content</p>',
        author: 'Test Author',
        category: 'Technology',
        tags: ['test', 'simple']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const blogId = createResponse.data.data?._id;
    console.log(`Blog created with ID ${blogId}`);
    
    // Update the blog with a simple direct call
    console.log('\nUpdating blog...');
    const updateResponse = await axios.put(
      `${API_URL}/content/blogs/${blogId}`,
      {
        title: 'Updated Blog Title',
        tags: ['updated', 'tags']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Update successful!');
    console.log('Updated blog:', updateResponse.data);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

testUpdate().catch(console.error);
