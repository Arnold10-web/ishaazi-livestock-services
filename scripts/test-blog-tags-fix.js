/**
 * Blog Tags Fix Test Script
 * 
 * This script tests the blog update functionality with various tag formats
 * to verify the fix for the 400 Bad Request error.
 */
const fetch = require('node-fetch');
const FormData = require('form-data');

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Color coding for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging utility
const log = {
  info: (message) => console.log(`${colors.blue}INFO: ${message}${colors.reset}`),
  success: (message) => console.log(`${colors.green}SUCCESS: ${message}${colors.reset}`),
  error: (message) => console.log(`${colors.red}ERROR: ${message}${colors.reset}`),
  warning: (message) => console.log(`${colors.yellow}WARNING: ${message}${colors.reset}`),
  divider: () => console.log('\n' + '='.repeat(50) + '\n')
};

async function loginAdmin() {
  log.info('🔑 Logging in as admin...');
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    });
    
    const data = await response.json();
    if (response.ok && data.token) {
      log.success('✅ Admin login successful');
      return data.token;
    } else {
      log.error(`❌ Admin login failed: ${data.message || response.statusText}`);
      return null;
    }
  } catch (error) {
    log.error(`❌ Error during admin login: ${error.message}`);
    return null;
  }
}

async function createTestBlog(token) {
  log.info('📝 Creating test blog...');
  
  const blog = {
    title: "Test Blog for Tags Fix - " + new Date().toISOString(),
    content: "<p>This is a test blog for verifying tag handling.</p>",
    author: "Test Author",
    category: "Technology",
    tags: ["test", "fix", "validation"],
    published: true
  };
  
  try {
    const formData = new FormData();
    Object.entries(blog).forEach(([key, value]) => {
      if (key === 'tags') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(`${API_URL}/content/blogs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const blogId = data._id || data.data?._id;
      log.success(`✅ Blog created with ID: ${blogId}`);
      return blogId;
    } else {
      log.error(`❌ Failed to create blog: ${data.message || response.statusText}`);
      console.log('Response:', data);
      return null;
    }
  } catch (error) {
    log.error(`❌ Error creating blog: ${error.message}`);
    return null;
  }
}

async function updateBlogWithTags(blogId, token, testCase) {
  log.info(`🔄 Testing ${testCase.name}...`);
  
  try {
    const formData = new FormData();
    Object.entries(testCase.data).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(`${API_URL}/content/blogs/${blogId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        // Not a JSON response
        responseData = {};
      }
      log.success(`✅ ${testCase.name} successful`);
      return true;
    } else {
      const responseData = await response.text();
      log.error(`❌ ${testCase.name} failed with status ${response.status}`);
      console.log('Response:', responseData);
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log('Error details:', jsonResponse.details || {});
      } catch (e) {
        // Not JSON response
      }
      return false;
    }
  } catch (error) {
    log.error(`❌ Error in ${testCase.name}: ${error.message}`);
    return false;
  }
}

async function runTagsTest() {
  log.divider();
  log.info('🚀 Starting Blog Tags Fix Test');
  log.divider();
  
  // Step 1: Login as admin
  const token = await loginAdmin();
  if (!token) {
    log.error('❌ Cannot continue without admin token');
    return;
  }
  
  // Step 2: Create a test blog
  const blogId = await createTestBlog(token);
  if (!blogId) {
    log.error('❌ Cannot continue without test blog');
    return;
  }
  
  // Step 3: Test different tag formats
  const testCases = [
    {
      name: "Update with empty array tags",
      data: {
        title: "Updated Title - Empty Array Tags",
        tags: []
      }
    },
    {
      name: "Update with string JSON array tags",
      data: {
        title: "Updated Title - String JSON Array Tags",
        tags: JSON.stringify(["tag1", "tag2", "tag3"])
      }
    },
    {
      name: "Update with array tags",
      data: {
        title: "Updated Title - Array Tags",
        tags: ["tag4", "tag5", "tag6"]
      }
    },
    {
      name: "Update with comma string tags",
      data: {
        title: "Updated Title - Comma String Tags",
        tags: "tag7, tag8, tag9"
      }
    },
    {
      name: "Update with null tags",
      data: {
        title: "Updated Title - Null Tags",
        tags: null
      }
    },
    {
      name: "Update without tags field",
      data: {
        title: "Updated Title - No Tags Field"
      }
    }
  ];
  
  // Run all test cases
  let passed = 0;
  for (const testCase of testCases) {
    log.divider();
    const success = await updateBlogWithTags(blogId, token, testCase);
    if (success) passed++;
  }
  
  // Summary
  log.divider();
  log.info(`Test Summary: ${passed}/${testCases.length} tests passed`);
  if (passed === testCases.length) {
    log.success('🎉 All tests passed! The blog tags fix is working.');
  } else {
    log.error(`❌ ${testCases.length - passed} tests failed.`);
  }
  log.divider();
}

// Run the tests
runTagsTest().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
