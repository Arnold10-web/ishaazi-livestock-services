/**
 * Blog Update Test Script
 * 
 * This script creates a blog post and then attempts to update it,
 * specifically testing the handling of tags in different formats.
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Test data for blog creation and updates
const originalBlog = {
  title: "Test Blog for Update",
  content: "<p>This is a test blog that will be updated.</p>",
  author: "Test Author",
  category: "Technology",
  tags: ["original", "test"],
  published: true
};

const updates = [
  {
    name: "Update with JSON string tags",
    data: {
      title: "Updated Title - JSON string tags",
      tags: JSON.stringify(["updated", "json", "tags"])
    }
  },
  {
    name: "Update with array tags",
    data: {
      title: "Updated Title - Array tags",
      tags: ["updated", "array", "tags"]
    }
  },
  {
    name: "Update with empty tags",
    data: {
      title: "Updated Title - Empty tags",
      tags: []
    }
  },
  {
    name: "Update without tags field",
    data: {
      title: "Updated Title - No tags field"
      // tags field omitted intentionally
    }
  }
];

// Helper for colored console output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  divider: () => console.log('\n' + '-'.repeat(80) + '\n'),
  section: (title) => {
    console.log('\n' + '*'.repeat(80));
    console.log(`\x1b[35m${title.toUpperCase()}\x1b[0m`);
    console.log('*'.repeat(80) + '\n');
  }
};

// Login to get auth token
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

// Create a test blog
async function createBlog(token) {
  log.info('📝 Creating test blog...');
  
  try {
    // Create FormData for the request
    const formData = new FormData();
    
    // Add fields to FormData
    Object.entries(originalBlog).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    // Send the request
    const response = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // Get response as text first to handle potential parsing issues
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log.error(`Failed to parse response: ${e.message}`);
      log.error(`Response: ${responseText}`);
      return null;
    }
    
    if (response.ok) {
      const id = data.data?._id || data._id;
      log.success(`✅ Blog created with ID: ${id}`);
      return id;
    } else {
      log.error(`❌ Failed to create blog: ${data.message || response.statusText}`);
      return null;
    }
  } catch (error) {
    log.error(`❌ Error creating blog: ${error.message}`);
    return null;
  }
}

// Update blog with different tag formats
async function updateBlog(id, updateData, token) {
  log.info(`🔄 Testing update: ${updateData.name}`);
  
  try {
    // Create FormData for the request
    const formData = new FormData();
    
    // Add update fields to FormData
    Object.entries(updateData.data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    console.log(`Sending update to ${API_URL}/content/blogs/${id}`);
    console.log('Update data:', updateData.data);
    
    // Send the update request
    const response = await fetch(`${API_URL}/content/blogs/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const responseText = await response.text();
    console.log('Response Text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log.error(`Failed to parse response: ${e.message}`);
      return false;
    }
    
    if (response.ok) {
      const title = data.title || 'Unknown';
      const tags = data.tags || [];
      log.success(`✅ Blog updated successfully! Title: "${title}"`);
      log.info(`   Tags: ${JSON.stringify(tags)}`);
      return true;
    } else {
      log.error(`❌ Failed to update blog: ${data.message || response.statusText}`);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
      return false;
    }
  } catch (error) {
    log.error(`❌ Error updating blog: ${error.message}`);
    return false;
  }
}

// Run the test for all update types
async function runTest() {
  log.section('BLOG UPDATE TEST');
  
  try {
    // Login first
    const token = await login();
    log.divider();
    
    // Create a blog
    const blogId = await createBlog(token);
    if (!blogId) {
      throw new Error('Failed to create test blog');
    }
    log.divider();
    
    // Test each update type
    const results = [];
    
    for (const update of updates) {
      const success = await updateBlog(blogId, update, token);
      results.push({ name: update.name, success });
      log.divider();
    }
    
    // Summary
    log.section('TEST RESULTS');
    console.table(results.reduce((acc, result) => {
      acc[result.name] = result.success ? '✅ PASS' : '❌ FAIL';
      return acc;
    }, {}));
    
    // Overall result
    const allPassed = results.every(r => r.success);
    if (allPassed) {
      log.success('🎉 ALL TESTS PASSED! Blog updates with various tag formats work correctly!');
    } else {
      log.error(`❌ Some tests failed. Check the results table above.`);
    }
    
  } catch (error) {
    log.error(`💥 Test failed: ${error.message}`);
  }
}

// Start the test
runTest();
