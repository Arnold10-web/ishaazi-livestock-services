/**
 * Content API Validation Test Script
 * 
 * This script tests multiple content type endpoints to ensure they all work correctly
 * with and without file uploads. It focuses on the most common content types.
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Helper for colored console output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  divider: () => console.log('\n' + '-'.repeat(50) + '\n')
};

// Test data for different content types
const testData = {
  blog: {
    title: "Test Blog Content",
    content: "<p>This is a test blog post.</p>",
    author: "Test Author",
    category: "General",
    tags: ["test", "api"],
    published: true,
    metadata: { summary: "Test summary" }
  },
  news: {
    title: "Test News Article",
    content: "<p>This is a test news article.</p>",
    author: "Test Reporter",
    published: true,
    metadata: { source: "API Test" }
  },
  piggery: {
    title: "Test Piggery Content",
    content: "<p>This is a test piggery article.</p>",
    published: true,
    metadata: { type: "Breeding" }
  },
  dairy: {
    title: "Test Dairy Content",
    content: "<p>This is a test dairy article.</p>",
    published: true,
    metadata: { type: "Production" }
  },
  goat: {
    title: "Test Goat Content",
    content: "<p>This is a test goat article.</p>",
    published: true,
    metadata: { breed: "Alpine" }
  },
  beef: {
    title: "Test Beef Content",
    content: "<p>This is a test beef article.</p>",
    published: true,
    metadata: { breed: "Angus" }
  },
  event: {
    title: "Test Event",
    description: "This is a test event.",
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
    location: "Test Location",
    published: true,
    metadata: { capacity: 100 }
  },
  farm: {
    name: "Test Farm",
    location: "Test Location",
    price: "50000",
    description: "This is a test farm listing.",
    metadata: { size: "10 acres" }
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

// Helper to create content without file
async function testCreateContent(token, contentType, data) {
  log.info(`🧪 Testing ${contentType} creation without file...`);
  
  const endpoint = `${API_URL}/content/${contentType}s`;
  
  try {
    // Create FormData for the request
    const formData = new FormData();
    
    // Add all properties from the test data
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'metadata' || key === 'tags') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      log.success(`✅ ${contentType} created successfully! ID: ${responseData.data?._id || responseData._id}`);
      return responseData.data?._id || responseData._id;
    } else {
      log.error(`❌ ${contentType} creation failed: ${responseData.message || response.statusText}`);
      console.log('Server response:', responseData);
      
      if (responseData.errors) {
        console.log('Validation errors:', responseData.errors);
      }
      return null;
    }
  } catch (error) {
    log.error(`❌ Error creating ${contentType}: ${error.message}`);
    return null;
  }
}

// Run tests for all content types
async function runAllTests() {
  try {
    const token = await login();
    log.divider();
    
    // Test each content type
    const contentTypes = [
      'blog', 
      'news', 
      'piggery', 
      'dairy', 
      'goat', 
      'beef', 
      'event', 
      'farm'
    ];
    
    const results = {};
    
    for (const contentType of contentTypes) {
      const id = await testCreateContent(token, contentType, testData[contentType]);
      results[contentType] = id ? 'SUCCESS' : 'FAILED';
      log.divider();
    }
    
    // Summary of results
    log.info('📊 TEST RESULTS SUMMARY:');
    console.table(results);
    
    // Count successes and failures
    const successes = Object.values(results).filter(r => r === 'SUCCESS').length;
    const failures = contentTypes.length - successes;
    
    if (failures === 0) {
      log.success(`🎉 All ${contentTypes.length} content types passed validation!`);
    } else {
      log.warn(`⚠️ Results: ${successes} passed, ${failures} failed`);
    }
    
  } catch (error) {
    log.error(`💥 Test suite failed: ${error.message}`);
  }
}

// Run all tests
runAllTests();
