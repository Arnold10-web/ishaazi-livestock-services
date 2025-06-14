/**
 * Comprehensive Content Form Test Script
 * 
 * This script tests all major content creation endpoints to verify they work properly.
 * It tests creating content with minimal required fields using FormData (like the frontend).
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Helper functions for colored console output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  divider: () => console.log('\n' + '-'.repeat(80) + '\n'),
  debug: (data) => console.log(JSON.stringify(data, null, 2))
};

// Test data for each content type with minimal required fields
const contentTypes = {
  blog: {
    endpoint: 'blogs',
    data: {
      title: "Test Blog Title",
      content: "<p>Test blog content paragraph.</p>",
      author: "Test Author"
    }
  },
  news: {
    endpoint: 'news',
    data: {
      title: "Test News Title",
      content: "<p>Test news content paragraph.</p>"
    }
  },
  event: {
    endpoint: 'events',
    data: {
      title: "Test Event Title", 
      description: "Test event description",
      startDate: new Date().toISOString() 
    }
  },
  farm: {
    endpoint: 'farms',
    data: {
      name: "Test Farm",
      location: "Test Location",
      price: "1000",
      description: "Test farm description"
    }
  },
  dairy: {
    endpoint: 'dairies',
    data: {
      title: "Test Dairy Title",
      content: "<p>Test dairy content paragraph.</p>"
    }
  },
  goat: {
    endpoint: 'goats',
    data: {
      title: "Test Goat Title",
      content: "<p>Test goat content paragraph.</p>"
    }
  },
  piggery: {
    endpoint: 'piggeries',
    data: {
      title: "Test Piggery Title",
      content: "<p>Test piggery content paragraph.</p>"
    }
  },
  beef: {
    endpoint: 'beefs',
    data: {
      title: "Test Beef Title",
      content: "<p>Test beef content paragraph.</p>"
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

// Test creating content for a specific type
async function testCreateContent(type, token) {
  const contentType = contentTypes[type];
  if (!contentType) {
    log.error(`Unknown content type: ${type}`);
    return null;
  }
  
  log.info(`🧪 Testing ${type} creation...`);
  
  try {
    // Create FormData object like the frontend would
    const formData = new FormData();
    
    // Add each field to FormData
    Object.entries(contentType.data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    // Set published to true for all content
    formData.append('published', 'true');
    
    // Send the request
    const response = await fetch(`${API_URL}/content/${contentType.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // Capture response text first
    const responseText = await response.text().catch(() => '');
    console.log(`Server response for ${type}:`, responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log(`Error parsing response for ${type}: ${e.message}`);
      data = { error: 'Response is not valid JSON' };
    }
    
    if (response.ok) {
      log.success(`✅ SUCCESS! ${type.toUpperCase()} created successfully`);
      return data.data?._id || data._id;
    } else {
      log.error(`❌ ERROR creating ${type}: ${data.message || response.statusText}`);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
      console.log('Full response:', responseText || data);
      return null;
    }
  } catch (error) {
    log.error(`❌ ERROR: ${error.message}`);
    return null;
  }
}

// Run tests for all content types
async function runAllTests() {
  log.info('🚀 Starting comprehensive content form testing...');
  log.divider();
  
  try {
    // Login first
    const token = await login();
    log.divider();
    
    // Test results tracking
    const results = {
      success: [],
      failure: []
    };
    
    // Run test for each content type
    for (const contentType of Object.keys(contentTypes)) {
      try {
        const id = await testCreateContent(contentType, token);
        if (id) {
          results.success.push(contentType);
        } else {
          results.failure.push(contentType);
        }
      } catch (e) {
        results.failure.push(contentType);
        log.error(`Error testing ${contentType}: ${e.message}`);
      }
      log.divider();
    }
    
    // Show summary
    log.info('📊 TEST RESULTS SUMMARY:');
    log.success(`✅ Successfully working content types: ${results.success.join(', ')}`);
    if (results.failure.length > 0) {
      log.error(`❌ Failing content types: ${results.failure.join(', ')}`);
    } else {
      log.success('🎉 All content types are working correctly!');
    }
    
  } catch (error) {
    log.error(`💥 Test suite failed: ${error.message}`);
  }
}

// Run the tests
runAllTests();
