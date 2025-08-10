#!/usr/bin/env node

/**
 * Test script for environment validation
 */

import dotenv from 'dotenv';
import { validateEnvironment, getEnvironmentHealth, hasRequiredEnvironment } from '../utils/environmentValidator.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Environment Validation\n');

// Test 1: Basic validation
console.log('=== Test 1: Basic Validation ===');
const validation = validateEnvironment();
console.log(`\nValidation result: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Health check format
console.log('\n=== Test 2: Health Check Format ===');
const health = getEnvironmentHealth();
console.log('Health status:', health.status);
console.log('Health details:', JSON.stringify(health.details, null, 2));

// Test 3: Required environment check
console.log('\n=== Test 3: Required Environment Check ===');
const hasRequired = hasRequiredEnvironment();
console.log(`Has required environment: ${hasRequired ? '✅ YES' : '❌ NO'}`);

console.log('\n🏁 Environment validation test complete!');