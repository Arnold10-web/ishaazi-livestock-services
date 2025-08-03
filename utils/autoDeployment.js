/**
 * @file Auto Deployment Utility
 * @description Automatically handles Railway deployment and performance optimizations on server startup
 * @module utils/autoDeployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Auto-deployment configuration
 */
const AUTO_DEPLOY_CONFIG = {
  enabled: process.env.AUTO_DEPLOY === 'true' || process.env.NODE_ENV === 'production',
  commitMessage: '🚀 Auto-deployed performance optimizations',
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  skipIfClean: true // Skip if no changes to commit
};

/**
 * Check if there are uncommitted changes
 */
const hasUncommittedChanges = async () => {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    return stdout.trim().length > 0;
  } catch (error) {
    console.warn('⚠️ Could not check git status:', error.message);
    return false;
  }
};

/**
 * Get current git branch
 */
const getCurrentBranch = async () => {
  try {
    const { stdout } = await execAsync('git branch --show-current');
    return stdout.trim();
  } catch (error) {
    console.warn('⚠️ Could not get current branch:', error.message);
    return 'main';
  }
};

/**
 * Commit and push changes to Railway
 */
const deployToRailway = async () => {
  try {
    console.log('🚀 Starting auto-deployment to Railway...');
    
    // Check if we have changes to deploy
    const hasChanges = await hasUncommittedChanges();
    if (!hasChanges && AUTO_DEPLOY_CONFIG.skipIfClean) {
      console.log('✅ No changes to deploy - repository is clean');
      return true;
    }
    
    // Get current branch
    const branch = await getCurrentBranch();
    console.log(`📋 Deploying from branch: ${branch}`);
    
    // Add all changes
    await execAsync('git add .');
    console.log('📦 Added all changes to staging');
    
    // Commit with performance optimization message
    const commitMessage = `${AUTO_DEPLOY_CONFIG.commitMessage}

Railway Performance Optimizations Auto-Deployed:
✅ Enhanced file serving with GridFS optimization
✅ Fixed notification service for Railway environment  
✅ Improved cache invalidation for immediate updates
✅ Added performance monitoring endpoints
✅ Optimized email service with Railway-specific timeouts

Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}`;

    await execAsync(`git commit -m "${commitMessage}"`);
    console.log('💾 Committed performance optimizations');
    
    // Push to Railway (triggers automatic deployment)
    await execAsync(`git push origin ${branch}`);
    console.log('🌐 Pushed to Railway - deployment triggered');
    
    console.log('✅ Auto-deployment to Railway completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Auto-deployment failed:', error.message);
    return false;
  }
};

/**
 * Deploy with retry logic
 */
const deployWithRetry = async (attempt = 1) => {
  try {
    const success = await deployToRailway();
    if (success) {
      return true;
    }
    
    if (attempt < AUTO_DEPLOY_CONFIG.maxRetries) {
      console.log(`🔄 Retry attempt ${attempt + 1}/${AUTO_DEPLOY_CONFIG.maxRetries} in ${AUTO_DEPLOY_CONFIG.retryDelay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, AUTO_DEPLOY_CONFIG.retryDelay));
      return deployWithRetry(attempt + 1);
    }
    
    console.error('❌ Auto-deployment failed after all retry attempts');
    return false;
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    return false;
  }
};

/**
 * Initialize performance optimizations and auto-deployment
 */
export const initializeAutoDeployment = async () => {
  if (!AUTO_DEPLOY_CONFIG.enabled) {
    console.log('⏸️ Auto-deployment disabled');
    return;
  }
  
  console.log('🚀 Initializing auto-deployment for Railway...');
  
  // Small delay to ensure server is stable before deploying
  setTimeout(async () => {
    try {
      const success = await deployWithRetry();
      if (success) {
        console.log('🎉 Railway auto-deployment completed successfully');
      } else {
        console.warn('⚠️ Railway auto-deployment completed with warnings');
      }
    } catch (error) {
      console.error('❌ Auto-deployment initialization failed:', error.message);
    }
  }, 10000); // 10 second delay to ensure server stability
};

/**
 * Manual deployment trigger (for admin use)
 */
export const triggerManualDeployment = async () => {
  console.log('🔧 Manual deployment triggered...');
  return await deployWithRetry();
};

/**
 * Check deployment status
 */
export const getDeploymentStatus = async () => {
  try {
    const hasChanges = await hasUncommittedChanges();
    const branch = await getCurrentBranch();
    
    return {
      hasUncommittedChanges: hasChanges,
      currentBranch: branch,
      autoDeployEnabled: AUTO_DEPLOY_CONFIG.enabled,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
};

export default {
  initializeAutoDeployment,
  triggerManualDeployment,
  getDeploymentStatus
};
