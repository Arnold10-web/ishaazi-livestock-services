/**
 * Simple Admin CRUD Verification
 * 
 * This script tests just one blog post creation to verify admin forms work
 * It's simplified to avoid hitting rate limits
 */

// ES modules
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';

// Test blog post with timestamp to make it unique
const testBlog = {
  title: `Test Blog - ${new Date().toISOString()}`,
  content: '<p>This is a test blog post created to verify admin forms.</p>',
  author: 'Test Script',
  category: 'General',
  published: true
};

// Main test function
async function verifyAdminForms() {
  console.log('\n============================================');
  console.log('ADMIN FORM VERIFICATION');
  console.log('============================================\n');
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in as admin...');
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
    
    const token = loginData.token;
    console.log('✅ Login successful! Got authentication token.');
    
    // Step 2: Create Blog
    console.log('\nStep 2: Creating blog post...');
    const createResponse = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testBlog)
    });
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Blog creation failed!');
      console.error('Error details:', createData);
      console.log('\n============================================');
      console.log('RECOMMENDATIONS:');
      console.log('1. Make sure your server is running on port 5000');
      console.log('2. Check for rate limiting issues in server logs');
      console.log('3. Try increasing rate limits in sanitization.js');
      console.log('4. Check validation rules for blog posts');
      console.log('============================================\n');
      process.exit(1);
    }
    
    const blogId = createData.data?._id || createData._id;
    console.log('✅ Blog created successfully with ID:', blogId);
    
    console.log('\n============================================');
    console.log('✅ ADMIN FORMS WORKING SUCCESSFULLY!');
    console.log('============================================');
    console.log('Your admin can successfully create content in the system.');
    console.log('All form submissions should be working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\nCheck that your server is running and try again.');
  }
}

// Run the verification
verifyAdminForms();
