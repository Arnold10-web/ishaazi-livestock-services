#!/usr/bin/env node

/**
 * CODEBASE CLEANUP SCRIPT
 * Identifies and removes unused/duplicate files
 * SAFE: Creates backup before deletion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Files that are candidates for removal (duplicates/unused)
const POTENTIALLY_UNUSED_FILES = [
  // Duplicate dashboard controllers
  'controllers/dashboardCleanupController.js', // Functionality merged into main dashboard
  
  // Redundant auth components (frontend)
  'farming-magazine-frontend/src/components/AdminAuth.js', // Replaced by EnhancedAdminAuth
  
  // Old optimization scripts (functionality integrated)
  'scripts/optimizeDatabase.js', // Replaced by criticalIndexes.js
];

// Files with consolidation opportunities
const CONSOLIDATION_CANDIDATES = {
  'controllers/enhancedAdminController.js': {
    consolidateWith: 'controllers/systemDashboardController.js',
    reason: 'Dashboard functionality can be merged'
  },
  'middleware/cache.js': {
    consolidateWith: 'middleware/enhancedCache.js', 
    reason: 'Duplicate caching logic'
  }
};

const analyzeCodebaseHealth = () => {
  console.log('🔍 ANALYZING CODEBASE HEALTH...\n');

  // Check file sizes
  const largeFiles = [];
  const checkDirectory = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        checkDirectory(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.ts'))) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 50000) { // Files larger than 50KB
          largeFiles.push({
            path: fullPath.replace(projectRoot, ''),
            size: `${Math.round(stats.size / 1024)}KB`
          });
        }
      }
    });
  };

  checkDirectory(projectRoot);

  console.log('📊 LARGE FILES (>50KB):');
  largeFiles.forEach(file => {
    console.log(`  ${file.path} (${file.size})`);
  });

  console.log('\n🎯 CLEANUP RECOMMENDATIONS:');
  console.log('  1. Controllers: Merge dashboardCleanupController.js into dashboardController.js');
  console.log('  2. Authentication: Remove old AdminAuth.js (replaced by EnhancedAdminAuth.js)');
  console.log('  3. Cache: Consolidate cache.js and enhancedCache.js');
  console.log('  4. Database: Remove old optimizeDatabase.js (replaced by criticalIndexes.js)');

  console.log('\n⚡ PERFORMANCE IMPROVEMENTS NEEDED:');
  console.log('  1. Add database indexes (run criticalIndexes.js)');
  console.log('  2. Implement search optimization middleware');
  console.log('  3. Enhance cache invalidation strategy');
  console.log('  4. Add file access rate limiting');

  return {
    largeFiles,
    potentiallyUnused: POTENTIALLY_UNUSED_FILES,
    consolidationNeeded: CONSOLIDATION_CANDIDATES
  };
};

const createBackup = (filePath) => {
  const backupDir = path.join(projectRoot, '.backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.${Date.now()}.bak`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`  ✅ Backup created: ${backupPath}`);
  return backupPath;
};

const removeUnusedFiles = (dryRun = true) => {
  console.log(`\n${dryRun ? '🧪 DRY RUN:' : '🗑️  REMOVING:'} Unused Files\n`);

  POTENTIALLY_UNUSED_FILES.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    
    if (fs.existsSync(fullPath)) {
      if (dryRun) {
        console.log(`  Would remove: ${filePath}`);
      } else {
        createBackup(fullPath);
        fs.unlinkSync(fullPath);
        console.log(`  ❌ Removed: ${filePath}`);
      }
    } else {
      console.log(`  ⚠️  Not found: ${filePath}`);
    }
  });
};

const generateCleanupPlan = () => {
  console.log('\n📋 COMPLETE CLEANUP PLAN:\n');
  
  const plan = {
    immediate: [
      'Run criticalIndexes.js for database performance',
      'Apply enhanced password security',
      'Update file access rate limiting',
      'Enhance cache invalidation strategy'
    ],
    shortTerm: [
      'Merge duplicate dashboard controllers',
      'Consolidate authentication components', 
      'Remove unused optimization scripts',
      'Implement search optimization middleware'
    ],
    longTerm: [
      'Refactor large files into smaller modules',
      'Implement comprehensive testing suite',
      'Add automated performance monitoring',
      'Create CI/CD pipeline for deployments'
    ]
  };

  Object.entries(plan).forEach(([phase, tasks]) => {
    console.log(`${phase.toUpperCase()}:`);
    tasks.forEach(task => console.log(`  • ${task}`));
    console.log('');
  });

  return plan;
};

// Main execution
const main = () => {
  console.log('🚀 ISHAAZI LIVESTOCK SERVICES - CODEBASE CLEANUP');
  console.log('='.repeat(50));
  
  const analysis = analyzeCodebaseHealth();
  const plan = generateCleanupPlan();
  
  // Ask for confirmation in real cleanup
  console.log('⚠️  TO EXECUTE CLEANUP (with backups):');
  console.log('   node scripts/cleanupCode.js --execute');
  console.log('');
  console.log('💡 TO RESTORE FROM BACKUP:');
  console.log('   Check .backup/ directory for timestamped backups');
};

// Check if should execute cleanup
if (process.argv.includes('--execute')) {
  removeUnusedFiles(false);
} else {
  main();
}

export default { analyzeCodebaseHealth, removeUnusedFiles, generateCleanupPlan };
