#!/usr/bin/env node

/**
 * Performance Optimization Validation Script
 * Tests and validates all performance optimizations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Performance Optimization Validation\n');

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function addResult(name, status, message) {
  results.details.push({ name, status, message });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'WARN') results.warnings++;
  
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${message}`);
}

// Test 1: Database indexing script exists
try {
  const indexScript = path.join(__dirname, '../scripts/createIndexes.js');
  if (fs.existsSync(indexScript)) {
    addResult('Database Indexing', 'PASS', 'Index creation script exists');
  } else {
    addResult('Database Indexing', 'FAIL', 'Index creation script not found');
  }
} catch (error) {
  addResult('Database Indexing', 'FAIL', `Error checking index script: ${error.message}`);
}

// Test 2: Redis caching middleware
try {
  const cacheMiddleware = path.join(__dirname, '../middleware/cache.js');
  if (fs.existsSync(cacheMiddleware)) {
    const content = fs.readFileSync(cacheMiddleware, 'utf8');
    if (content.includes('CacheService') && content.includes('cacheMiddleware')) {
      addResult('Redis Caching', 'PASS', 'Cache middleware implemented');
    } else {
      addResult('Redis Caching', 'FAIL', 'Cache middleware incomplete');
    }
  } else {
    addResult('Redis Caching', 'FAIL', 'Cache middleware not found');
  }
} catch (error) {
  addResult('Redis Caching', 'FAIL', `Error checking cache middleware: ${error.message}`);
}

// Test 3: Image optimization middleware
try {
  const uploadMiddleware = path.join(__dirname, '../middleware/fileUpload.js');
  if (fs.existsSync(uploadMiddleware)) {
    const content = fs.readFileSync(uploadMiddleware, 'utf8');
    if (content.includes('sharp') && content.includes('optimizeImage')) {
      addResult('Image Optimization', 'PASS', 'Sharp-based optimization implemented');
    } else {
      addResult('Image Optimization', 'FAIL', 'Image optimization not found in middleware');
    }
  } else {
    addResult('Image Optimization', 'FAIL', 'Upload middleware not found');
  }
} catch (error) {
  addResult('Image Optimization', 'FAIL', `Error checking upload middleware: ${error.message}`);
}

// Test 4: Frontend code splitting
try {
  const appJs = path.join(__dirname, '../farming-magazine-frontend/src/App.js');
  if (fs.existsSync(appJs)) {
    const content = fs.readFileSync(appJs, 'utf8');
    if (content.includes('lazy(') && content.includes('Suspense')) {
      addResult('Code Splitting', 'PASS', 'React lazy loading implemented');
    } else {
      addResult('Code Splitting', 'FAIL', 'Code splitting not properly implemented');
    }
  } else {
    addResult('Code Splitting', 'FAIL', 'Frontend App.js not found');
  }
} catch (error) {
  addResult('Code Splitting', 'FAIL', `Error checking App.js: ${error.message}`);
}

// Test 5: Service Worker
try {
  const swPath = path.join(__dirname, '../farming-magazine-frontend/public/sw.js');
  if (fs.existsSync(swPath)) {
    addResult('Service Worker', 'PASS', 'Service worker file exists');
  } else {
    addResult('Service Worker', 'FAIL', 'Service worker not found');
  }
} catch (error) {
  addResult('Service Worker', 'FAIL', `Error checking service worker: ${error.message}`);
}

// Test 6: Performance dashboard component
try {
  const dashboardPath = path.join(__dirname, '../farming-magazine-frontend/src/components/PerformanceDashboard.js');
  if (fs.existsSync(dashboardPath)) {
    addResult('Performance Dashboard', 'PASS', 'Dashboard component exists');
  } else {
    addResult('Performance Dashboard', 'FAIL', 'Dashboard component not found');
  }
} catch (error) {
  addResult('Performance Dashboard', 'FAIL', `Error checking dashboard: ${error.message}`);
}

// Test 7: Bundle build exists
try {
  const buildPath = path.join(__dirname, '../farming-magazine-frontend/build');
  if (fs.existsSync(buildPath)) {
    const files = fs.readdirSync(buildPath);
    if (files.length > 0) {
      addResult('Production Build', 'PASS', 'Build directory contains files');
    } else {
      addResult('Production Build', 'WARN', 'Build directory is empty');
    }
  } else {
    addResult('Production Build', 'FAIL', 'Build directory not found');
  }
} catch (error) {
  addResult('Production Build', 'FAIL', `Error checking build: ${error.message}`);
}

// Test 8: Package dependencies
try {
  const packageJson = path.join(__dirname, '../package.json');
  const frontendPackageJson = path.join(__dirname, '../farming-magazine-frontend/package.json');
  
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    if (pkg.dependencies && pkg.dependencies.redis) {
      addResult('Backend Dependencies', 'PASS', 'Redis dependency installed');
    } else {
      addResult('Backend Dependencies', 'FAIL', 'Redis dependency missing');
    }
  }
  
  if (fs.existsSync(frontendPackageJson)) {
    const pkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
    if (pkg.dependencies && pkg.dependencies['react-loadable'] && pkg.dependencies['webpack-bundle-analyzer']) {
      addResult('Frontend Dependencies', 'PASS', 'Optimization dependencies installed');
    } else {
      addResult('Frontend Dependencies', 'FAIL', 'Optimization dependencies missing');
    }
  }
} catch (error) {
  addResult('Package Dependencies', 'FAIL', `Error checking dependencies: ${error.message}`);
}

// Test 9: API routes optimization
try {
  const routesPath = path.join(__dirname, '../routes/contentRoutes.js');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    if (content.includes('cacheMiddleware') && content.includes('invalidateCache')) {
      addResult('API Route Optimization', 'PASS', 'Cache middleware applied to routes');
    } else {
      addResult('API Route Optimization', 'FAIL', 'Route optimization not applied');
    }
  } else {
    addResult('API Route Optimization', 'FAIL', 'Content routes not found');
  }
} catch (error) {
  addResult('API Route Optimization', 'FAIL', `Error checking routes: ${error.message}`);
}

// Test 10: Documentation
try {
  const perfDoc = path.join(__dirname, '../docs/performance-optimization-results.md');
  if (fs.existsSync(perfDoc)) {
    addResult('Documentation', 'PASS', 'Performance results documented');
  } else {
    addResult('Documentation', 'WARN', 'Performance documentation not found');
  }
} catch (error) {
  addResult('Documentation', 'WARN', `Error checking documentation: ${error.message}`);
}

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

const totalScore = (results.passed / (results.passed + results.failed + results.warnings)) * 100;
console.log(`\n🎯 Overall Score: ${totalScore.toFixed(1)}%`);

if (results.failed === 0) {
  console.log('\n🎉 All critical optimizations are in place!');
} else {
  console.log('\n⚠️  Some optimizations need attention.');
}

// Performance recommendations
console.log('\n🔧 Next Steps:');
if (results.failed > 0) {
  console.log('- Fix failed optimization checks');
}
console.log('- Run performance monitoring dashboard');
console.log('- Test application under load');
console.log('- Monitor cache hit rates');
console.log('- Analyze bundle sizes regularly');

console.log('\n✨ Performance optimization validation complete!');
