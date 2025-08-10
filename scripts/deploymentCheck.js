#!/usr/bin/env node

/**
 * Enhanced Deployment Readiness Check
 * Validates API endpoints, environment consistency, and deployment configuration
 * 
 * @module scripts/deploymentCheck
 */

import { validateEnvironment, hasRequiredEnvironment } from '../utils/environmentValidator.js';
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Check if all required static assets exist
 */
function checkStaticAssets() {
  console.log('📁 Checking static assets...');
  
  const requiredAssets = [
    'public/placeholder-image.jpg',
    'public/placeholder-farm-image.jpg', 
    'public/images/placeholder-media.png',
    'public/images/ishaazi.jpg'
  ];
  
  const results = {
    status: 'healthy',
    missing: [],
    present: []
  };
  
  for (const asset of requiredAssets) {
    const fullPath = resolve(rootDir, asset);
    if (existsSync(fullPath)) {
      const stats = statSync(fullPath);
      results.present.push({
        path: asset,
        size: `${Math.round(stats.size / 1024)}KB`,
        exists: true
      });
      console.log(`✅ ${asset} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      results.missing.push(asset);
      results.status = 'unhealthy';
      console.log(`❌ Missing: ${asset}`);
    }
  }
  
  return results;
}

/**
 * Check API routes and endpoint consistency
 */
function checkAPIEndpoints() {
  console.log('\n🔗 Checking API endpoints...');
  
  const routesDir = resolve(rootDir, 'routes');
  const results = {
    status: 'healthy',
    routes: [],
    issues: []
  };
  
  if (!existsSync(routesDir)) {
    results.status = 'unhealthy';
    results.issues.push('Routes directory not found');
    console.log('❌ Routes directory not found');
    return results;
  }
  
  try {
    const routeFiles = readdirSync(routesDir).filter(file => file.endsWith('.js'));
    
    console.log(`Found ${routeFiles.length} route files:`);
    routeFiles.forEach(file => {
      console.log(`✅ ${file}`);
      results.routes.push(file);
    });
    
    // Check for essential route files
    const essentialRoutes = [
      'healthRoutes.js',
      'fileRoutes.js',
      'contentRoutes.js'
    ];
    
    const missingEssential = essentialRoutes.filter(route => 
      !routeFiles.includes(route)
    );
    
    if (missingEssential.length > 0) {
      results.issues.push(`Missing essential routes: ${missingEssential.join(', ')}`);
      console.log(`⚠️  Missing essential routes: ${missingEssential.join(', ')}`);
    }
    
  } catch (error) {
    results.status = 'unhealthy';
    results.issues.push(`Error reading routes: ${error.message}`);
    console.log(`❌ Error reading routes: ${error.message}`);
  }
  
  return results;
}

/**
 * Check deployment configuration
 */
async function checkDeploymentConfig() {
  console.log('\n⚙️  Checking deployment configuration...');
  
  const results = {
    status: 'healthy',
    configs: [],
    issues: []
  };
  
  // Check for deployment configuration files
  const deploymentFiles = [
    'railway.toml',
    'package.json',
    '.railwayignore'
  ];
  
  deploymentFiles.forEach(file => {
    const fullPath = resolve(rootDir, file);
    if (existsSync(fullPath)) {
      console.log(`✅ ${file} exists`);
      results.configs.push(file);
    } else {
      console.log(`⚠️  ${file} missing (optional)`);
    }
  });
  
  // Check package.json scripts
  try {
    const packageJsonPath = resolve(rootDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const fs = await import('fs');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredScripts = ['start', 'start:production'];
      const missingScripts = requiredScripts.filter(script => 
        !packageJson.scripts[script]
      );
      
      if (missingScripts.length > 0) {
        results.status = 'unhealthy';
        results.issues.push(`Missing required scripts: ${missingScripts.join(', ')}`);
        console.log(`❌ Missing required scripts: ${missingScripts.join(', ')}`);
      } else {
        console.log('✅ All required scripts present');
      }
    }
  } catch (error) {
    results.issues.push(`Error checking package.json: ${error.message}`);
    console.log(`❌ Error checking package.json: ${error.message}`);
  }
  
  return results;
}

/**
 * Check production optimizations
 */
function checkProductionOptimizations() {
  console.log('\n⚡ Checking production optimizations...');
  
  const results = {
    status: 'healthy',
    optimizations: [],
    recommendations: []
  };
  
  // Check for optimization utilities
  const optimizationFiles = [
    'utils/productionOptimization.js',
    'middleware/performanceMetrics.js',
    'middleware/rateLimiter.js',
    'middleware/enhancedCache.js'
  ];
  
  optimizationFiles.forEach(file => {
    const fullPath = resolve(rootDir, file);
    if (existsSync(fullPath)) {
      console.log(`✅ ${file.split('/').pop()} optimization available`);
      results.optimizations.push(file);
    } else {
      console.log(`⚠️  ${file.split('/').pop()} optimization missing`);
      results.recommendations.push(`Consider adding ${file}`);
    }
  });
  
  return results;
}

/**
 * Generate deployment summary
 */
function generateSummary(checks) {
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
  console.log('=' .repeat(50));
  
  const allHealthy = Object.values(checks).every(check => 
    check.status === 'healthy'
  );
  
  console.log(`Overall Status: ${allHealthy ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);
  
  // Calculate confidence score
  let score = 100;
  let deductions = 0;
  
  Object.entries(checks).forEach(([checkName, result]) => {
    console.log(`\n${checkName.charAt(0).toUpperCase() + checkName.slice(1)}:`);
    console.log(`  Status: ${result.status === 'healthy' ? '✅ Healthy' : '❌ Issues Found'}`);
    
    if (result.issues && result.issues.length > 0) {
      console.log(`  Issues: ${result.issues.length}`);
      result.issues.forEach(issue => console.log(`    - ${issue}`));
      deductions += result.issues.length * 5;
    }
    
    if (result.missing && result.missing.length > 0) {
      console.log(`  Missing: ${result.missing.length}`);
      result.missing.forEach(missing => console.log(`    - ${missing}`));
      deductions += result.missing.length * 10;
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`    - ${error}`));
      deductions += result.errors.length * 15;
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(`  Recommendations: ${result.recommendations.length}`);
      result.recommendations.forEach(rec => console.log(`    - ${rec}`));
      deductions += result.recommendations.length * 2;
    }
  });
  
  const finalScore = Math.max(0, score - deductions);
  
  console.log('\n🎯 DEPLOYMENT CONFIDENCE SCORE');
  console.log('=' .repeat(30));
  console.log(`Score: ${finalScore}/100`);
  
  if (finalScore >= 95) {
    console.log('🚀 Excellent! Ready for production deployment');
  } else if (finalScore >= 85) {
    console.log('✅ Good! Minor issues to address before deployment');
  } else if (finalScore >= 70) {
    console.log('⚠️  Fair! Several issues need attention');
  } else {
    console.log('❌ Poor! Major issues must be resolved before deployment');
  }
  
  return {
    ready: allHealthy && finalScore >= 85,
    score: finalScore,
    summary: checks
  };
}

/**
 * Main deployment check function
 */
async function main() {
  console.log('🚀 DEPLOYMENT READINESS CHECK');
  console.log('=' .repeat(50));
  console.log(`Checking deployment readiness for: ${rootDir}\n`);
  
  try {
    // Run all checks
    const checks = {
      environment: validateEnvironment(),
      staticAssets: checkStaticAssets(),
      apiEndpoints: checkAPIEndpoints(),
      deploymentConfig: await checkDeploymentConfig(),
      productionOptimizations: checkProductionOptimizations()
    };
    
    // Generate summary
    const summary = generateSummary(checks);
    
    // Exit with appropriate code
    process.exit(summary.ready ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Deployment check failed:', error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;