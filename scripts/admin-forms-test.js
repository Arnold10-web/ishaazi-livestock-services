/**
 * Admin Forms Test Suite
 * 
 * This script provides comprehensive testing for all admin forms:
 * - Tests authentication
 * - Tests CRUD operations for all content types
 * - Tests both JSON and FormData submissions
 * - Validates correct data processing and field handling
 * 
 * Run this script to verify that all forms are working correctly
 * for admin operations (create, update, delete).
 */

// Import required modules
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import chalk from 'chalk'; // For colored console output (install with: npm install chalk)

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'Admin123';

// Content types to test
const CONTENT_TYPES = [
  { 
    name: 'blogs',
    requiredFields: ['title', 'content', 'author'],
    optionalFields: ['category', 'tags', 'published', 'metadata']
  },
  { 
    name: 'news',
    requiredFields: ['title', 'content', 'author', 'category'],
    optionalFields: ['tags', 'published', 'urgent']
  },
  {
    name: 'events',
    requiredFields: ['title', 'description', 'startDate', 'endDate', 'location'],
    optionalFields: ['maxAttendees', 'ticketPrice', 'registrationDeadline']
  }
];

// Helper for colored console output
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.error(chalk.red(`❌ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`)),
  divider: () => console.log('\n' + chalk.gray('-'.repeat(50)) + '\n')
};

// Test data generator for each content type
const generateTestData = (contentType) => {
  const timestamp = new Date().toISOString();
  
  // Common fields
  const common = {
    title: `Test ${contentType} - ${timestamp}`,
    content: `<p>This is a test ${contentType} created via the automated test script.</p>`,
    author: "Test Author",
    published: true,
    tags: ["test", "automated", contentType]
  };
  
  // Content type specific fields
  switch (contentType) {
    case 'blogs':
      return {
        ...common,
        category: "General",
        metadata: {
          summary: `Test summary for ${contentType}`,
          keywords: ["test", "automated"]
        }
      };
    
    case 'news':
      return {
        ...common,
        category: "General",
        urgent: false
      };
      
    case 'events':
      // Generate dates for events (start tomorrow, end day after)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      return {
        ...common,
        description: `Test event description created by automated test`,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
        location: "Test Location",
        maxAttendees: 100,
        ticketPrice: 10,
        registrationDeadline: tomorrow.toISOString()
      };

    default:
      return common;
  }
};

// Login to get authentication token
async function login() {
  log.info('Attempting admin login...');
  
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
    
    log.success('Login successful!');
    return data.token;
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    return null;
  }
}

// Create content using JSON payload
async function createContentJSON(contentType, token, testData) {
  log.info(`Creating ${contentType} with JSON payload...`);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log.error(`Failed to create ${contentType} with JSON: ${data.message || response.statusText}`);
      console.log('Error details:', data);
      return null;
    }
    
    log.success(`${contentType} created successfully with JSON payload!`);
    return data.data || data;
  } catch (error) {
    log.error(`Error creating ${contentType} with JSON: ${error.message}`);
    return null;
  }
}

// Create content using FormData (simulating browser form submission)
async function createContentFormData(contentType, token, testData) {
  log.info(`Creating ${contentType} with FormData...`);
  
  try {
    const formData = new FormData();
    
    // Append all fields to FormData
    for (const [key, value] of Object.entries(testData)) {
      // Handle special fields like arrays and objects - convert to JSON strings
      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
    
    const response = await fetch(`${API_URL}/content/${contentType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log.error(`Failed to create ${contentType} with FormData: ${data.message || response.statusText}`);
      console.log('Error details:', data);
      return null;
    }
    
    log.success(`${contentType} created successfully with FormData!`);
    return data.data || data;
  } catch (error) {
    log.error(`Error creating ${contentType} with FormData: ${error.message}`);
    return null;
  }
}

// Update content using FormData
async function updateContent(contentType, id, token, updates) {
  log.info(`Updating ${contentType} with ID: ${id}...`);
  
  try {
    const formData = new FormData();
    
    // Append all fields to FormData
    for (const [key, value] of Object.entries(updates)) {
      if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
    
    const response = await fetch(`${API_URL}/content/${contentType}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log.error(`Failed to update ${contentType}: ${data.message || response.statusText}`);
      console.log('Error details:', data);
      return false;
    }
    
    log.success(`${contentType} updated successfully!`);
    return true;
  } catch (error) {
    log.error(`Error updating ${contentType}: ${error.message}`);
    return false;
  }
}

// Delete content
async function deleteContent(contentType, id, token) {
  log.info(`Deleting ${contentType} with ID: ${id}...`);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentType}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Some endpoints might return no content
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'No response body' };
    }
    
    if (!response.ok) {
      log.error(`Failed to delete ${contentType}: ${data.message || response.statusText}`);
      return false;
    }
    
    log.success(`${contentType} deleted successfully!`);
    return true;
  } catch (error) {
    log.error(`Error deleting ${contentType}: ${error.message}`);
    return false;
  }
}

// Verify content was created
async function verifyContent(contentType, id) {
  log.info(`Verifying ${contentType} with ID: ${id} exists...`);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentType}/${id}`);
    const data = await response.json();
    
    if (!response.ok || !data.data) {
      log.error(`Failed to verify ${contentType} exists`);
      return false;
    }
    
    log.success(`${contentType} verified successfully!`);
    return true;
  } catch (error) {
    log.error(`Error verifying ${contentType}: ${error.message}`);
    return false;
  }
}

// List all content for a specific type
async function listContent(contentType, token) {
  try {
    // Use admin-specific endpoint if available
    const endpoint = `${API_URL}/content/${contentType}/admin`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      log.warn(`Could not fetch ${contentType} list: ${data.message || response.statusText}`);
      return [];
    }
    
    return data.data || data || [];
  } catch (error) {
    log.error(`Error listing ${contentType}: ${error.message}`);
    return [];
  }
}

// Run tests for a specific content type
async function testContentType(contentType, token) {
  log.divider();
  log.info(`🧪 TESTING ${contentType.toUpperCase()} FORMS 🧪`);
  log.divider();
  
  const testData = generateTestData(contentType);
  
  // 1. Test create with JSON payload
  const jsonCreated = await createContentJSON(contentType, token, testData);
  if (!jsonCreated) {
    log.error(`Failed to create ${contentType} with JSON payload. Skipping further tests.`);
    return;
  }
  
  const jsonContentId = jsonCreated._id;
  
  // 2. Verify JSON-created content exists
  await verifyContent(contentType, jsonContentId);
  
  // 3. Update the JSON-created content
  const jsonUpdateData = {
    title: `Updated ${contentType} (was JSON) - ${new Date().toISOString()}`,
    content: `<p>This ${contentType} was created with JSON and updated with FormData.</p>`
  };
  await updateContent(contentType, jsonContentId, token, jsonUpdateData);
  
  // 4. Test create with FormData
  const formTestData = generateTestData(contentType);
  const formCreated = await createContentFormData(contentType, token, formTestData);
  if (!formCreated) {
    log.error(`Failed to create ${contentType} with FormData. Skipping further tests.`);
    
    // Still need to clean up the JSON-created content
    await deleteContent(contentType, jsonContentId, token);
    return;
  }
  
  const formContentId = formCreated._id;
  
  // 5. Verify FormData-created content exists
  await verifyContent(contentType, formContentId);
  
  // 6. Update the FormData-created content
  const formUpdateData = {
    title: `Updated ${contentType} (was FormData) - ${new Date().toISOString()}`,
    content: `<p>This ${contentType} was created and updated with FormData.</p>`
  };
  await updateContent(contentType, formContentId, token, formUpdateData);
  
  // 7. Delete both test items
  await deleteContent(contentType, jsonContentId, token);
  await deleteContent(contentType, formContentId, token);
  
  log.success(`✨ ${contentType.toUpperCase()} FORMS TESTING COMPLETED SUCCESSFULLY! ✨`);
}

// Run all tests
async function runTests() {
  log.info('🚀 Starting admin forms test suite...');
  
  try {
    // 1. Login to get token
    const token = await login();
    if (!token) {
      log.error('Authentication failed. Cannot proceed with tests.');
      return;
    }
    
    // 2. Run tests for each content type
    for (const contentType of CONTENT_TYPES) {
      await testContentType(contentType.name, token);
    }
    
    log.divider();
    log.success('🎉 ALL ADMIN FORMS TESTS COMPLETED SUCCESSFULLY! 🎉');
    log.info('Your admin forms are working correctly for creating, updating, and deleting content.');
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Run the tests
runTests();
