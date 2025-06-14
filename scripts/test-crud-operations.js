/**
 * Comprehensive CRUD Operations Test Script
 * 
 * This script tests full CRUD functionality for all major content types:
 * 1. CREATE - Creates a new content item
 * 2. READ - Fetches the created content by ID
 * 3. UPDATE - Updates the created content
 * 4. DELETE - Deletes the created content
 */

// Update these with your actual admin credentials
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';
const API_URL = 'http://localhost:5000/api';

// Helper for colored console output and formatting
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

// Configuration for all content types with their endpoints and test data
const contentTypes = {
  blog: {
    singularName: 'blog',
    endpoint: 'blogs',
    createData: {
      title: "Test CRUD Blog",
      content: "<p>This is a test blog post for CRUD operations.</p>",
      author: "CRUD Tester",
      category: "Technology",
      tags: ["test", "crud", "api"],
      published: true
    },
    updateData: {
      title: "Updated Blog Title",
      content: "<p>This content has been updated via the API.</p>"
    }
  },
  news: {
    singularName: 'news',
    endpoint: 'news',
    createData: {
      title: "Test CRUD News",
      content: "<p>This is a test news article for CRUD operations.</p>",
      author: "CRUD Reporter",
      published: true
    },
    updateData: {
      title: "Updated News Title",
      content: "<p>This news article has been updated via the API.</p>"
    }
  },
  event: {
    singularName: 'event',
    endpoint: 'events',
    createData: {
      title: "Test CRUD Event",
      description: "This is a test event for CRUD operations.",
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      location: "Test Location",
      published: true
    },
    updateData: {
      title: "Updated Event Title",
      description: "This event has been updated via the API."
    }
  },
  farm: {
    singularName: 'farm',
    endpoint: 'farms',
    createData: {
      name: "Test CRUD Farm",
      location: "Test Farm Location",
      price: "55000",
      description: "This is a test farm listing for CRUD operations."
    },
    updateData: {
      name: "Updated Farm Name",
      price: "60000"
    }
  },
  dairy: {
    singularName: 'dairy',
    endpoint: 'dairies',
    createData: {
      title: "Test CRUD Dairy",
      content: "<p>This is a test dairy article for CRUD operations.</p>",
      published: true
    },
    updateData: {
      title: "Updated Dairy Title",
      content: "<p>This dairy article has been updated via the API.</p>"
    }
  },
  goat: {
    singularName: 'goat',
    endpoint: 'goats',
    createData: {
      title: "Test CRUD Goat",
      content: "<p>This is a test goat article for CRUD operations.</p>",
      published: true
    },
    updateData: {
      title: "Updated Goat Title",
      content: "<p>This goat article has been updated via the API.</p>"
    }
  },
  piggery: {
    singularName: 'piggery',
    endpoint: 'piggeries',
    createData: {
      title: "Test CRUD Piggery",
      content: "<p>This is a test piggery article for CRUD operations.</p>",
      published: true
    },
    updateData: {
      title: "Updated Piggery Title",
      content: "<p>This piggery article has been updated via the API.</p>"
    }
  },
  beef: {
    singularName: 'beef',
    endpoint: 'beefs',
    createData: {
      title: "Test CRUD Beef",
      content: "<p>This is a test beef article for CRUD operations.</p>",
      published: true
    },
    updateData: {
      title: "Updated Beef Title",
      content: "<p>This beef article has been updated via the API.</p>"
    }
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

// CREATE: Create new content item
async function testCreate(type, token) {
  const contentType = contentTypes[type];
  if (!contentType) return null;
  
  log.info(`📝 CREATE: Creating ${type}...`);
  
  try {
    // Create FormData for the request
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(contentType.createData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    // Send the request
    const response = await fetch(`${API_URL}/content/${contentType.endpoint}`, {
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
      // Extract ID based on response structure
      const id = data.data?._id || data._id;
      log.success(`✅ CREATE: ${type} created successfully with ID: ${id}`);
      return id;
    } else {
      log.error(`❌ CREATE: Failed to create ${type}: ${data.message || response.statusText}`);
      return null;
    }
  } catch (error) {
    log.error(`❌ CREATE: Error creating ${type}: ${error.message}`);
    return null;
  }
}

// READ: Retrieve content by ID
async function testRead(type, id) {
  const contentType = contentTypes[type];
  if (!contentType || !id) return false;
  
  log.info(`📖 READ: Retrieving ${type} with ID: ${id}...`);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentType.endpoint}/${id}`);
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log.error(`Failed to parse response: ${e.message}`);
      log.error(`Response: ${responseText}`);
      return false;
    }
    
    if (response.ok) {
      const title = data.data?.title || data.title || data.data?.name || data.name || 'Unknown';
      log.success(`✅ READ: ${type} retrieved successfully: "${title}"`);
      return true;
    } else {
      log.error(`❌ READ: Failed to retrieve ${type}: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    log.error(`❌ READ: Error retrieving ${type}: ${error.message}`);
    return false;
  }
}

// UPDATE: Update content by ID
async function testUpdate(type, id, token) {
  const contentType = contentTypes[type];
  if (!contentType || !id) return false;
  
  log.info(`🔄 UPDATE: Updating ${type} with ID: ${id}...`);
  
  try {
    // Create FormData for the request
    const formData = new FormData();
    
    // Add update fields to FormData
    Object.entries(contentType.updateData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    // Send the request
    const response = await fetch(`${API_URL}/content/${contentType.endpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log.error(`Failed to parse response: ${e.message}`);
      log.error(`Response: ${responseText}`);
      return false;
    }
    
    if (response.ok) {
      log.success(`✅ UPDATE: ${type} updated successfully`);
      return true;
    } else {
      log.error(`❌ UPDATE: Failed to update ${type}: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    log.error(`❌ UPDATE: Error updating ${type}: ${error.message}`);
    return false;
  }
}

// DELETE: Delete content by ID
async function testDelete(type, id, token) {
  const contentType = contentTypes[type];
  if (!contentType || !id) return false;
  
  log.info(`🗑️ DELETE: Deleting ${type} with ID: ${id}...`);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentType.endpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      log.error(`Failed to parse response: ${e.message}`);
      log.error(`Response: ${responseText}`);
      return false;
    }
    
    if (response.ok) {
      log.success(`✅ DELETE: ${type} deleted successfully`);
      return true;
    } else {
      log.error(`❌ DELETE: Failed to delete ${type}: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    log.error(`❌ DELETE: Error deleting ${type}: ${error.message}`);
    return false;
  }
}

// Run all CRUD tests for a specific content type
async function testCRUDForContentType(type, token) {
  log.section(`TESTING ${type.toUpperCase()} CRUD OPERATIONS`);
  
  // Initialize results tracking
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false
  };
  
  // Step 1: Create
  const id = await testCreate(type, token);
  results.create = !!id;
  
  if (id) {
    // Step 2: Read
    results.read = await testRead(type, id);
    
    // Step 3: Update
    results.update = await testUpdate(type, id, token);
    
    // Step 4: Delete
    results.delete = await testDelete(type, id, token);
  }
  
  // Summary for this content type
  log.info(`\n📊 ${type.toUpperCase()} RESULTS:`);
  console.table({
    'CREATE': results.create ? '✅ PASS' : '❌ FAIL',
    'READ': results.read ? '✅ PASS' : '❌ FAIL',
    'UPDATE': results.update ? '✅ PASS' : '❌ FAIL',
    'DELETE': results.delete ? '✅ PASS' : '❌ FAIL'
  });
  
  return results;
}

// Run tests for all content types
async function runAllTests() {
  log.section('STARTING COMPREHENSIVE CRUD OPERATIONS TEST');
  
  try {
    // Login first
    const token = await login();
    log.divider();
    
    // Test results for all content types
    const allResults = {};
    
    // Test each content type
    for (const contentType of Object.keys(contentTypes)) {
      allResults[contentType] = await testCRUDForContentType(contentType, token);
      log.divider();
    }
    
    // Final summary
    log.section('FINAL TEST RESULTS');
    
    const summary = {
      passed: 0,
      failed: 0,
      totalTests: Object.keys(contentTypes).length * 4 // 4 operations per content type
    };
    
    // Calculate overall results
    Object.values(allResults).forEach(result => {
      if (result.create) summary.passed++;
      else summary.failed++;
      
      if (result.read) summary.passed++;
      else summary.failed++;
      
      if (result.update) summary.passed++;
      else summary.failed++;
      
      if (result.delete) summary.passed++;
      else summary.failed++;
    });
    
    log.info(`📊 OVERALL RESULTS: ${summary.passed}/${summary.totalTests} tests passed`);
    
    if (summary.failed === 0) {
      log.success('🎉 ALL TESTS PASSED! Your CRUD operations are working correctly!');
    } else {
      log.warn(`⚠️ ${summary.failed} tests failed. Check the logs above for details.`);
    }
    
  } catch (error) {
    log.error(`💥 Test suite failed: ${error.message}`);
  }
}

// Start the tests
runAllTests();
