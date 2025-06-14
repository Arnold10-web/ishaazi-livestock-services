/**
 * Blog API Test Script
 * 
 * This script tests the blog API endpoints using axios to simulate Postman requests.
 * It provides detailed validation testing for the blog creation endpoint.
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results counters
const results = {
  total: 0,
  passed: 0,
  failed: 0
};

/**
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Display test result
 */
function testResult(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log(`✓ PASS: ${name}`, colors.green);
  } else {
    results.failed++;
    log(`✗ FAIL: ${name}`, colors.red);
    if (details) {
      log(`  Details: ${details}`, colors.yellow);
    }
  }
  console.log(); // Empty line for spacing
}

/**
 * Get auth token from login API
 */
async function getAuthToken() {
  try {
    log('Attempting to login to get auth token...', colors.blue);
    const response = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    const token = response.data.token;
    if (token) {
      log('Successfully obtained auth token.', colors.green);
      return token;
    } else {
      log('Token was not found in response.', colors.red);
      return null;
    }
  } catch (error) {
    log('Failed to get auth token. Tests will likely fail if endpoints require authentication.', colors.red);
    console.error('Error details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test: Create a blog post with author in top level
 */
async function testCreateBlogWithAuthor(token) {
  log('TEST 1: Create Blog Post with Author in Top Level', colors.cyan);
  try {
    const response = await axios.post(`${API_URL}/content/blogs`, {
      title: 'Test Blog Post via Script',
      content: '<p>This is a test blog post content created via API test script.</p>',
      author: 'Test Author',
      category: 'General',
      tags: ['test', 'api', 'validation'],
      published: true,
      metadata: {
        keywords: ['test', 'api', 'farming'],
        summary: 'This is a test summary'
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200 || response.status === 201;
    testResult('Create blog with author in top level', success, 
      success ? `Created blog with ID: ${response.data.data?._id || 'unknown'}` : JSON.stringify(response.data));
    return success;
  } catch (error) {
    testResult('Create blog with author in top level', false, 
      `Error: ${error.response?.data?.message || error.message}`);
    console.error('Full error response:', error.response?.data);
    return false;
  }
}

/**
 * Test: Create a blog post with author in metadata
 */
async function testCreateBlogWithAuthorInMetadata(token) {
  log('TEST 2: Create Blog Post with Author in Metadata', colors.cyan);
  try {
    const response = await axios.post(`${API_URL}/content/blogs`, {
      title: 'Test Blog with Author in Metadata',
      content: '<p>This blog post has the author information stored in the metadata object.</p>',
      category: 'Technology',
      tags: ['test', 'metadata'],
      published: true,
      metadata: {
        author: 'Metadata Author',
        keywords: ['test', 'metadata', 'farming'],
        summary: 'This is a test with author in metadata'
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200 || response.status === 201;
    testResult('Create blog with author in metadata', success, 
      success ? `Created blog with ID: ${response.data.data?._id || 'unknown'}` : JSON.stringify(response.data));
    return success;
  } catch (error) {
    testResult('Create blog with author in metadata', false, 
      `Error: ${error.response?.data?.message || error.message}`);
    console.error('Full error response:', error.response?.data);
    return false;
  }
}

/**
 * Test: Create a blog post with minimal fields
 */
async function testCreateBlogMinimalFields(token) {
  log('TEST 3: Create Blog Post with Minimal Fields', colors.cyan);
  try {
    const response = await axios.post(`${API_URL}/content/blogs`, {
      title: 'Minimal Blog Post',
      content: '<p>This is a minimal blog post with only required fields.</p>'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200 || response.status === 201;
    testResult('Create blog with minimal fields', success, 
      success ? `Created blog with ID: ${response.data.data?._id || 'unknown'}` : JSON.stringify(response.data));
    return success;
  } catch (error) {
    testResult('Create blog with minimal fields', false, 
      `Error: ${error.response?.data?.message || error.message}`);
    console.error('Full error response:', error.response?.data);
    return false;
  }
}

/**
 * Test: Create a blog post with form data
 */
async function testCreateBlogFormData(token) {
  log('TEST 4: Create Blog Post with FormData (Multipart)', colors.cyan);
  try {
    const formData = new FormData();
    formData.append('title', 'Form Data Blog Post');
    formData.append('content', '<p>This is a blog post created using form data.</p>');
    formData.append('author', 'Form Author');
    formData.append('category', 'General');
    formData.append('tags', JSON.stringify(['form', 'data', 'test']));
    formData.append('metadata', JSON.stringify({ summary: 'Form data test' }));
    formData.append('published', 'true');
    
    // Optional: Add a test image file if available
    try {
      const testImagePath = path.join(__dirname, '../farming-magazine-frontend/public/logo.png');
      if (fs.existsSync(testImagePath)) {
        formData.append('image', fs.createReadStream(testImagePath));
        log('Including test image in form data request', colors.blue);
      }
    } catch (err) {
      log('No test image file available, continuing without image', colors.yellow);
    }
    
    const response = await axios.post(`${API_URL}/content/blogs`, formData, {
      headers: { 
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}` 
      }
    });
    
    const success = response.status === 200 || response.status === 201;
    testResult('Create blog with form data', success, 
      success ? `Created blog with ID: ${response.data.data?._id || 'unknown'}` : JSON.stringify(response.data));
    return success;
  } catch (error) {
    testResult('Create blog with form data', false, 
      `Error: ${error.response?.data?.message || error.message}`);
    console.error('Full error response:', error.response?.data);
    return false;
  }
}

/**
 * Run tests for the blog API
 */
async function runTests() {
  log('Starting Blog API Tests', colors.blue);
  log('==========================\n', colors.blue);
  
  // Get auth token
  const token = await getAuthToken();
  if (!token) {
    log('Cannot proceed without authentication token. Aborting tests.', colors.red);
    return;
  }
  
  // Run all tests
  await testCreateBlogWithAuthor(token);
  await testCreateBlogWithAuthorInMetadata(token);
  await testCreateBlogMinimalFields(token);
  await testCreateBlogFormData(token);
  
  // Summary of results
  log('\n==========================', colors.blue);
  log('Test Results Summary:', colors.blue);
  log(`Total Tests: ${results.total}`, colors.reset);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log('==========================\n', colors.blue);
  
  // Overall assessment
  if (results.failed === 0) {
    log('✓ All tests passed! Your blog API is working correctly.', colors.green);
    log('You should be able to create blogs from the web interface now.', colors.green);
  } else {
    log('✗ Some tests failed. Check the details above for troubleshooting.', colors.red);
  }
}

// Run all tests
runTests().catch(error => {
  log('Unexpected error running tests:', colors.red);
  console.error(error);
});
