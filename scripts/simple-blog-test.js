/**
 * Simple Blog API Test Script
 * 
 * This script tests the blog API endpoint directly using fetch.
 * Just update the credentials below with your actual admin username and password.
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Test data for creating a blog
const testBlog = {
  title: "Test Blog Post via Direct Script",
  content: "<p>This is a test blog post content.</p>",
  author: "Test Author", 
  category: "General",
  tags: ["test", "api"],
  published: true,
  metadata: {
    summary: "Test summary"
  }
};

// Login and then create blog
async function runTest() {
  console.log('Starting test...');
  
  // Step 1: Login to get token
  console.log('Attempting login...');
  try {
    const loginResponse = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('Login successful, got token');
    
    // Step 2: Create blog with token using FormData
    console.log('\nAttempting to create blog using FormData...');
    
    // Create FormData object for multipart/form-data submission
    const formData = new FormData();
    formData.append('title', testBlog.title);
    formData.append('content', testBlog.content);
    formData.append('author', testBlog.author);
    formData.append('category', testBlog.category);
    formData.append('tags', JSON.stringify(testBlog.tags));
    formData.append('metadata', JSON.stringify(testBlog.metadata));
    formData.append('published', testBlog.published);
    
    // No need to set Content-Type header with FormData - it will be set automatically with boundary
    // Make sure tags is sent as a JSON string that will be parsed into an array
    
    // Check if tags field exists and is properly formatted
    console.log('FormData tag entry:', formData.get('tags'));
    
    const createResponse = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('\n✅ SUCCESS! Blog created successfully:');
      console.log('Blog ID:', createData.data?._id);
      console.log('Title:', createData.data?.title);
      console.log('\nYour blog validation is working correctly!');
      console.log('You should now be able to create blogs from your form.');
    } else {
      console.error('\n❌ ERROR: Blog creation failed:');
      console.error(createData);
      console.log('\nCheck the error message above for details.');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();
