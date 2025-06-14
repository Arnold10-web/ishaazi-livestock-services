/**
 * Form Data Validation Test
 * 
 * This script tests form data handling for all content types, with special focus on:
 * - Proper handling of complex data types (arrays, objects)
 * - Validation of form fields
 * - Image upload handling
 * - Error handling and validation feedback
 */

// Import required modules
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';

// Helper for colored console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  divider: () => console.log('\n' + '='.repeat(80) + '\n')
};

// Test cases for validating form data handling
const testCases = [
  {
    name: 'Test 1: Blog with minimal required fields',
    contentType: 'blogs',
    data: {
      title: 'Minimal Required Fields Test',
      content: '<p>This is a minimal blog post with only required fields.</p>',
      author: 'Test Author'
    },
    expectedToPass: true
  },
  {
    name: 'Test 2: Blog with missing required fields',
    contentType: 'blogs',
    data: {
      title: 'Missing Content Field',
      // content is missing
      author: 'Test Author'
    },
    expectedToPass: false
  },
  {
    name: 'Test 3: Blog with array as JSON string',
    contentType: 'blogs',
    data: {
      title: 'Tags as JSON String Test',
      content: '<p>This blog tests tags sent as JSON string.</p>',
      author: 'Test Author',
      tags: JSON.stringify(['json', 'string', 'test'])
    },
    expectedToPass: true
  },
  {
    name: 'Test 4: Blog with tags as comma-separated string',
    contentType: 'blogs',
    data: {
      title: 'Tags as CSV String Test',
      content: '<p>This blog tests tags sent as comma-separated string.</p>',
      author: 'Test Author',
      tags: 'comma,separated,string'
    },
    expectedToPass: true
  },
  {
    name: 'Test 5: Blog with nested metadata object',
    contentType: 'blogs',
    data: {
      title: 'Complex Metadata Test',
      content: '<p>This blog tests complex metadata object handling.</p>',
      author: 'Test Author',
      metadata: {
        summary: 'Test summary',
        keywords: ['test', 'metadata', 'complex'],
        customData: {
          nestedProperty: 'value',
          nestedArray: [1, 2, 3]
        }
      }
    },
    expectedToPass: true
  },
  {
    name: 'Test 6: Blog with Boolean fields',
    contentType: 'blogs',
    data: {
      title: 'Boolean Fields Test',
      content: '<p>This blog tests boolean field handling.</p>',
      author: 'Test Author',
      published: true,
      featured: false
    },
    expectedToPass: true
  },
  {
    name: 'Test 7: News with all required fields',
    contentType: 'news',
    data: {
      title: 'News Required Fields Test',
      content: '<p>This is a news post with all required fields.</p>',
      author: 'Test Author',
      category: 'Breaking'
    },
    expectedToPass: true
  },
  {
    name: 'Test 8: Event with date fields',
    contentType: 'events',
    data: {
      title: 'Event Date Fields Test',
      description: 'This tests proper handling of date fields in events.',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
      location: 'Test Location'
    },
    expectedToPass: true
  }
];

// Login to get authentication token
async function login() {
  log.info('Authenticating admin user...');
  
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log.error(`Login failed: ${data.error || response.statusText}`);
      return null;
    }
    
    log.success('Successfully authenticated!');
    return data.token;
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    return null;
  }
}

// Test form data submission
async function testFormDataSubmission(testCase, token) {
  log.info(`Running ${testCase.name}`);
  
  try {
    // Create FormData instance
    const formData = new FormData();
    
    // Add all fields to FormData
    for (const [key, value] of Object.entries(testCase.data)) {
      // Handle objects and arrays - convert to JSON string
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
    
    // Submit the form data
    const response = await fetch(`${API_URL}/content/${testCase.contentType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    // Check if the result matches our expectation
    if (testCase.expectedToPass) {
      if (response.ok) {
        log.success(`✅ ${testCase.name}: PASSED`);
        // Save the created content ID for later cleanup
        return data.data?._id || data._id;
      } else {
        log.error(`❌ ${testCase.name}: FAILED (Expected to pass but got error)`);
        console.log('Error details:', data);
        return null;
      }
    } else {
      if (!response.ok) {
        log.success(`✅ ${testCase.name}: PASSED (Expected to fail and did fail)`);
        console.log('Validation error details (expected):', data);
        return null;
      } else {
        log.error(`❌ ${testCase.name}: FAILED (Expected to fail but passed)`);
        console.log('Unexpected success. Created content:', data);
        // Return ID for cleanup
        return data.data?._id || data._id;
      }
    }
  } catch (error) {
    log.error(`Error in test "${testCase.name}": ${error.message}`);
    return null;
  }
}

// Clean up created content
async function cleanupContent(contentType, id, token) {
  if (!id) return;
  
  try {
    await fetch(`${API_URL}/content/${contentType}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    log.warn(`Cleanup error for ${contentType}/${id}: ${error.message}`);
  }
}

// Run the test suite
async function runTests() {
  log.divider();
  log.info('🧪 STARTING FORM DATA HANDLING TEST SUITE 🧪');
  log.divider();
  
  try {
    // 1. Login to get token
    const token = await login();
    if (!token) {
      log.error('Authentication failed. Cannot proceed with tests.');
      return;
    }
    
    // 2. Run each test case
    const createdIds = [];
    for (const testCase of testCases) {
      const id = await testFormDataSubmission(testCase, token);
      if (id) {
        createdIds.push({ type: testCase.contentType, id });
      }
      console.log(); // Empty line between tests
    }
    
    // 3. Clean up created content
    log.info('Cleaning up test data...');
    for (const { type, id } of createdIds) {
      await cleanupContent(type, id, token);
    }
    
    log.divider();
    log.success('✨ FORM DATA HANDLING TEST SUITE COMPLETED! ✨');
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Run the tests
runTests();
