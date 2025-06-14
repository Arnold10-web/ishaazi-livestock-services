/**
 * Testing Helper Script
 * 
 * This script runs the admin CRUD test with rate limiting disabled
 * by temporarily setting NODE_ENV to 'test'
 */

// Set the environment variable to bypass rate limiting
process.env.NODE_ENV = 'test';

// Import fetch for the script to use
import fetch from 'node-fetch';

// Now, run the tests directly
console.log('\n--------------------------------------------------\n');
console.log('🔹 ADMIN CRUD TEST: STARTING');
console.log('\n--------------------------------------------------\n');

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';

// Simple test blog post data
const testBlog = {
  title: `Test Blog Post - ${new Date().toLocaleDateString()}`,
  content: '<p>This is a test blog post to verify admin CRUD operations.</p>',
  author: 'Test Author',
  category: 'General',
  tags: ['test', 'admin', 'crud'],
  published: true
};

// For updating the blog
const updateData = {
  title: `UPDATED: Test Blog Post - ${new Date().toLocaleDateString()}`,
  content: '<p>This blog post has been updated successfully!</p>'
};

// Helper for colored console output
const output = {
  info: (msg) => console.log(`\n🔹 ${msg}`),
  success: (msg) => console.log(`\n✅ ${msg}`),
  error: (msg) => console.error(`\n❌ ${msg}`),
  divider: () => console.log('\n' + '-'.repeat(50) + '\n')
};

// Run the test sequence
async function runTest() {
  let token, blogId;
  
  try {
    // STEP 1: Login
    output.info('STEP 1: Admin Login');
    const loginResponse = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.token) {
      throw new Error(`Login failed: ${loginData.error || loginResponse.statusText}`);
    }
    
    token = loginData.token;
    output.success('Login successful! Got authentication token.');
    
    // STEP 2: Create Blog
    output.info('STEP 2: Creating Blog Post');
    const createResponse = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testBlog)
    });
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok || !createData.data) {
      throw new Error(`Blog creation failed: ${createData.message || createResponse.statusText}`);
    }
    
    blogId = createData.data._id;
    output.success(`Blog created successfully! ID: ${blogId}`);
    
    // STEP 3: Update Blog
    output.info('STEP 3: Updating Blog Post');
    const updateResponse = await fetch(`${API_URL}/content/blogs/${blogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      throw new Error(`Blog update failed: ${updateResult.message || updateResponse.statusText}`);
    }
    
    output.success('Blog updated successfully!');
    
    // STEP 4: Verify Update
    output.info('STEP 4: Verifying Blog Update');
    const verifyResponse = await fetch(`${API_URL}/content/blogs/${blogId}`);
    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok || !verifyData.data) {
      throw new Error(`Blog verification failed: ${verifyData.message || verifyResponse.statusText}`);
    }
    
    // Check that the blog was actually updated
    if (verifyData.data.title !== updateData.title) {
      throw new Error(`Update verification failed: Title doesn't match expected value`);
    }
    
    output.success('Blog update verified successfully!');
    
    // STEP 5: Delete Blog
    output.info('STEP 5: Deleting Blog Post');
    const deleteResponse = await fetch(`${API_URL}/content/blogs/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Some APIs return no content on successful delete
    if (!deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      throw new Error(`Blog deletion failed: ${deleteData.message || deleteResponse.statusText}`);
    }
    
    output.success('Blog deleted successfully!');
    
    // STEP 6: Verify Deletion
    output.info('STEP 6: Verifying Blog Deletion');
    const checkResponse = await fetch(`${API_URL}/content/blogs/${blogId}`);
    
    if (checkResponse.status !== 404) {
      const checkData = await checkResponse.json();
      throw new Error(`Delete verification failed: Blog still exists with status ${checkResponse.status}`);
    }
    
    output.success('Blog deletion verified successfully!');
    
    // ALL DONE!
    output.divider();
    output.success('ALL ADMIN CRUD OPERATIONS COMPLETED SUCCESSFULLY!');
    output.success('Your admin forms are working correctly for creating, updating, and deleting content.');
    output.divider();
    
  } catch (error) {
    output.error(`TEST FAILED: ${error.message}`);
    
    // Cleanup any dangling test data
    if (token && blogId) {
      output.info('Attempting to clean up test data...');
      try {
        await fetch(`${API_URL}/content/blogs/${blogId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (cleanupError) {
        output.error(`Cleanup failed: ${cleanupError.message}`);
      }
    }
    
    output.divider();
    output.error('TEST SUITE FAILED');
    output.divider();
  }
}

// Run the test
runTest();
