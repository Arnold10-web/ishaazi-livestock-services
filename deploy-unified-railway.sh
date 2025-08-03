#!/bin/bash

# Unified Railway Auto-Deployment Script
# This script commits and pushes to trigger Railway deployment with auto-deployment features

echo "🚀 Railway Auto-Deployment Script"
echo "=================================="

# Check git status
echo "📋 Current repository status:"
git status --short

echo ""
echo "📦 Adding all changes..."
git add .

echo "💾 Committing unified performance optimizations..."
git commit -m "🚀 Unified Railway Performance & Auto-Deployment System

✅ UNIFIED PERFORMANCE SYSTEM:
- Combined Railway-specific optimizations into single utils/unifiedPerformance.js
- Enhanced file serving with caching and range request support
- Improved cache invalidation for immediate content updates
- Performance monitoring and diagnostics

✅ AUTO-DEPLOYMENT SYSTEM:
- Added utils/autoDeployment.js for automatic Railway deployment
- Server automatically deploys performance fixes on startup in production
- Manual deployment trigger via admin panel: POST /api/performance/deploy
- Deployment status monitoring and retry logic

✅ ADMIN FEATURES:
- Manual cache refresh: POST /api/performance/cache/refresh
- System diagnostics: GET /api/performance/diagnostics
- Manual deployment trigger: POST /api/performance/deploy
- Content sync monitoring: GET /api/performance/content/sync-status

✅ RAILWAY OPTIMIZATIONS:
- Fixed notification service URLs and timeouts for Railway environment
- Enhanced GridFS file serving with CDN optimization
- Memory cache management for Railway containers
- Production-ready error handling and logging

🤖 AUTOMATED FEATURES:
- Server automatically commits and deploys performance fixes
- No manual intervention required for Railway deployment
- Intelligent retry logic and deployment status tracking
- Performance monitoring with automatic slow request detection

This system ensures Railway production environment runs optimally with automatic performance improvements."

echo ""
echo "🌐 Pushing to Railway for automatic deployment..."
git push origin main

echo ""
echo "✅ Railway Auto-Deployment Complete!"
echo ""
echo "🤖 AUTOMATIC FEATURES ENABLED:"
echo "  - Server will auto-deploy on next startup"
echo "  - Performance monitoring active"
echo "  - Cache management optimized"
echo "  - Admin deployment controls available"
echo ""
echo "📊 New Admin Endpoints:"
echo "  - POST /api/performance/cache/refresh"
echo "  - POST /api/performance/deploy" 
echo "  - GET /api/performance/diagnostics"
echo "  - GET /api/performance/content/sync-status"
echo ""
echo "🚀 Railway will deploy these changes automatically."
echo "💡 Monitor deployment at: https://railway.app"
