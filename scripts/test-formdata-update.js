/**
 * Blog FormData Update Test
 * 
 * This script tests updating a blog using FormData exclusively (no direct JSON).
 */
import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFormDataUpdate() {
  console.log('Testing blog update with FormData approach exclusively...');
  
  // Step 1: Login
  const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
  const token = loginResponse.data.token;
  console.log('Login successful');
  
  // Wait to avoid rate limits
  console.log('Waiting 2 seconds...');
  await delay(2000);
  
  // Step 2: Create a test blog using FormData
  const createFormData = new FormData();
  createFormData.append('title', 'FormData Test Blog - ' + new Date().toISOString());
  createFormData.append('content', '<p>This is content created with FormData</p>');
  createFormData.append('author', 'FormData Tester');
  createFormData.append('category', 'Technology');
  createFormData.append('tags', 'formdata,test,initial');
  createFormData.append('published', 'true');
  
  console.log('Creating blog with FormData...');
  const createConfig = {
    headers: { 
      ...createFormData.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  };
  
  let blogId;
  try {
    const createResponse = await axios.post(`${API_URL}/content/blogs`, createFormData, createConfig);
    blogId = createResponse.data.data?._id || createResponse.data._id;
    console.log(`Created blog with ID: ${blogId}`);
    console.log('Create response data:', createResponse.data);
  } catch (error) {
    console.error('Blog creation failed:', error.message);
    console.error('Response:', error.response?.data);
    return;
  }
  
  // Wait to avoid rate limits
  console.log('Waiting 2 seconds...');
  await delay(2000);
  
  // Step 3: Update the blog using FormData
  const updateFormData = new FormData();
  updateFormData.append('title', 'Updated FormData Blog - ' + new Date().toISOString());
  updateFormData.append('content', '<p>This content was updated with FormData</p>');
  updateFormData.append('author', 'FormData Update Tester');
  updateFormData.append('category', 'Technology');
  
  // Important: Send tags as comma-separated string
  updateFormData.append('tags', 'updated,formdata,test');
  
  updateFormData.append('published', 'true');
  
  console.log('Updating blog with FormData...');
  const updateConfig = {
    headers: { 
      ...updateFormData.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const updateResponse = await axios.put(`${API_URL}/content/blogs/${blogId}`, updateFormData, updateConfig);
    console.log('Update successful!');
    console.log('Update response:', updateResponse.data);
  } catch (error) {
    console.error('Update failed!');
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
  
  // Wait to avoid rate limits
  console.log('Waiting 2 seconds...');
  await delay(2000);
  
  // Step 4: Verify the update
  try {
    const getResponse = await axios.get(`${API_URL}/content/blogs/${blogId}`);
    console.log('\nRetrieved updated blog:');
    console.log('Title:', getResponse.data.data?.title);
    console.log('Tags:', getResponse.data.data?.tags);
    console.log('Author:', getResponse.data.data?.author);
  } catch (error) {
    console.error('Failed to retrieve updated blog');
    console.error(error.message);
  }
}

testFormDataUpdate().catch(err => console.error('Unhandled error:', err));
