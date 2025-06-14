/**
 * Debug Blog Form Test
 * 
 * This script simulates exactly what the frontend form would do when updating a blog.
 */

// This must match what the Form frontend is doing
import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };

async function debugFormTest() {
  console.log('Starting blog form debug test...');
  
  // Step 1: Login
  console.log('Logging in...');
  const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
  const token = loginResponse.data.token;
  console.log('Login successful, got token');
  
  // Step 2: Create a blog
  console.log('\nCreating test blog...');
  
  const createFormData = new FormData();
  createFormData.append('title', 'Debug Form Test Blog');
  createFormData.append('content', '<p>Test content</p>');
  createFormData.append('author', 'Test Author');
  createFormData.append('tags', JSON.stringify(['initial', 'test']));
  createFormData.append('published', 'true');
  
  const createResponse = await axios.post(`${API_URL}/content/blogs`, createFormData, {
    headers: {
      ...createFormData.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  });
  
  const blogId = createResponse.data.data._id;
  console.log(`Blog created with ID: ${blogId}`);
  
  // Step 3: Update the blog - simulate exactly what the frontend form does
  console.log('\nUpdating blog to match frontend form behavior...');
  
  // This is the exact code from BlogForm.js handleSubmit function
  const formData = new FormData();
  formData.append('title', 'Updated Blog Title');
  formData.append('content', '<p>Updated content</p>');
  formData.append('category', 'Technology');
  formData.append('author', 'Updated Author');
  
  // Convert tags from comma-separated string to array
  const tags = "updated, test, tags";
  const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  // Add tags in the new array-style format
  tagsArray.forEach((tag, index) => {
    formData.append(`tags[${index}]`, tag);
  });
  
  // Generate metadata from inputs
  const metadata = {};
  const keywords = "keyword1, keyword2";
  const summary = "This is a summary";
  if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
  if (summary.trim()) metadata.summary = summary.trim();
  formData.append('metadata', JSON.stringify(metadata));
  
  formData.append('published', 'true');
  
  console.log('Form data contents:');
  console.log('- title:', 'Updated Blog Title');
  console.log('- tags (original):', tags);
  console.log('- tags (processed):', JSON.stringify(tagsArray));
  
  try {
    const updateResponse = await axios.put(`${API_URL}/content/blogs/${blogId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\nUpdate successful!');
    console.log('Update response:', updateResponse.data);
    
    // Verify by getting the blog
    const getResponse = await axios.get(`${API_URL}/content/blogs/${blogId}`);
    console.log('\nRetrieved blog:');
    console.log('Title:', getResponse.data.data.title);
    console.log('Tags:', getResponse.data.data.tags);
    console.log('Published:', getResponse.data.data.published);
  } catch (error) {
    console.error('\nUpdate failed!');
    console.error('Error:', error.message);
    console.error('Response data:', error.response?.data);
    
    // Check what was sent in the request
    console.log('\nRequest details:');
    console.log('URL:', `${API_URL}/content/blogs/${blogId}`);
    for (const [key, value] of Object.entries(formData)) {
      console.log(`${key}:`, value);
    }
  }
}

debugFormTest().catch(err => console.error('Unhandled error:', err));
