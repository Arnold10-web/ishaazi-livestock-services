/**
 * Simple Blog Update Test Script
 * 
 * This script creates a test blog and updates it with different formats of tags
 */
import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';
const ADMIN_CREDS = { username: 'Admin', password: 'Admin123' };

async function runTest() {
  console.log('Starting simple blog update test...');
  
  // Login
  let token;
  try {
    const loginResponse = await axios.post(`${API_URL}/admin/login`, ADMIN_CREDS);
    token = loginResponse.data.token;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    return;
  }
  
  // Create test blog
  let blogId;
  try {
    const formData = new FormData();
    formData.append('title', 'Test Blog for Tag Updates ' + new Date().toISOString().slice(0, 16));
    formData.append('content', '<p>This is a test blog post for testing tag updates.</p>');
    formData.append('author', 'Test Author');
    formData.append('tags', JSON.stringify(['initial', 'test', 'tags']));
    
    const createResponse = await axios.post(`${API_URL}/content/blogs`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check different possibilities for where the ID might be located
    blogId = createResponse.data._id || createResponse.data.data?._id || createResponse.data.id;
    console.log(`✅ Blog created with ID: ${blogId}`);
    console.log('Blog response data:', JSON.stringify(createResponse.data));
  } catch (error) {
    console.error('❌ Blog creation failed:', error.response?.data || error.message);
    return;
  }
  
  // Update with array tags
  try {
    const formData = new FormData();
    formData.append('title', 'Updated Blog Title - Array Tags');
    
    // Try both ways of adding tags
    const tagsArray = ['updated', 'array', 'tags'];
    formData.append('tags', JSON.stringify(tagsArray));
    
    console.log('Sending update with tags:', JSON.stringify(tagsArray));
    const updateResponse = await axios.put(`${API_URL}/content/blogs/${blogId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update with array tags successful');
    console.log('Update response:', JSON.stringify(updateResponse.data));
  } catch (error) {
    console.error('❌ Update with array tags failed:', error.response?.data || error.message);
  }
  
  console.log('Test completed!');
}

runTest().catch(err => {
  console.error('Unhandled error:', err);
});
