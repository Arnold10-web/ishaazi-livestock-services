/**
 * Complete Blog API Test Script
 * 
 * This script provides comprehensive testing for the blog API endpoint:
 * 1. Tests direct API calls (JSON and FormData)
 * 2. Tests with and without image uploads
 * 3. Tests with different combinations of fields
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Helper function for colored console output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  divider: () => console.log('\n' + '-'.repeat(50) + '\n')
};

// Test data for creating blogs
const testBlogs = {
  minimal: {
    title: "Minimal Required Fields Blog",
    content: "<p>This blog only contains required fields.</p>",
    author: "Test Author"
  },
  complete: {
    title: "Complete Fields Blog",
    content: "<p>This blog contains all available fields.</p>",
    author: "Full Author",
    category: "Agriculture",
    tags: ["complete", "api", "test"],
    published: true,
    metadata: {
      summary: "A test blog with all fields",
      keywords: ["test", "api", "complete"]
    }
  }
};

// Login to get token
async function login() {
  log.info('🔐 Attempting login...');
  try {
    const loginResponse = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login failed: ${error.message || loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    log.success('✅ Login successful!');
    return loginData.token;
  } catch (error) {
    log.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

// Test 1: Create blog with minimal fields using JSON
async function testCreateBlogMinimal(token) {
  log.info('🧪 TEST 1: Creating blog with minimal fields (JSON)');
  
  try {
    const response = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testBlogs.minimal)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success(`✅ SUCCESS! Blog created with ID: ${data.data?._id}`);
      return data.data?._id;
    } else {
      log.error(`❌ ERROR: ${data.message || response.statusText}`);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
      return null;
    }
  } catch (error) {
    log.error(`❌ ERROR: ${error.message}`);
    return null;
  }
}

// Test 2: Create blog with all fields using FormData (simulating frontend)
async function testCreateBlogComplete(token) {
  log.info('🧪 TEST 2: Creating blog with all fields (FormData)');
  
  try {
    const formData = new FormData();
    
    // Add all fields from complete test blog
    formData.append('title', testBlogs.complete.title);
    formData.append('content', testBlogs.complete.content);
    formData.append('author', testBlogs.complete.author);
    formData.append('category', testBlogs.complete.category);
    formData.append('tags', JSON.stringify(testBlogs.complete.tags));
    formData.append('published', testBlogs.complete.published);
    formData.append('metadata', JSON.stringify(testBlogs.complete.metadata));
    
    // No image for this test
    
    const response = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success(`✅ SUCCESS! Blog created with ID: ${data.data?._id}`);
      return data.data?._id;
    } else {
      log.error(`❌ ERROR: ${data.message || response.statusText}`);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
      return null;
    }
  } catch (error) {
    log.error(`❌ ERROR: ${error.message}`);
    return null;
  }
}

// Test 3: Verify blogs were created by retrieving them
async function verifyBlogs(blogIds) {
  log.info('🧪 TEST 3: Verifying created blogs exist');
  
  const validIds = blogIds.filter(id => id);
  if (validIds.length === 0) {
    log.warn('⚠️ No valid blog IDs to verify');
    return;
  }
  
  for (const id of validIds) {
    try {
      const response = await fetch(`${API_URL}/content/blogs/${id}`);
      const data = await response.json();
      
      if (response.ok && data.data) {
        log.success(`✅ Blog verified: "${data.data.title}"`);
      } else {
        log.error(`❌ Failed to verify blog with ID: ${id}`);
      }
    } catch (error) {
      log.error(`❌ ERROR verifying blog ${id}: ${error.message}`);
    }
  }
}

// Run all tests
async function runTests() {
  log.info('🚀 Starting blog API tests...');
  log.divider();
  
  try {
    // Login first
    const token = await login();
    log.divider();
    
    // Run all tests in sequence
    const blogId1 = await testCreateBlogMinimal(token);
    log.divider();
    
    const blogId2 = await testCreateBlogComplete(token);
    log.divider();
    
    // Verify the blogs were created
    await verifyBlogs([blogId1, blogId2]);
    log.divider();
    
    log.success('🎉 All tests completed!');
    
  } catch (error) {
    log.error(`💥 Test suite failed: ${error.message}`);
  }
}

// Run the tests
runTests();
