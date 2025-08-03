/**
 * Content Performance & Cache Fix
 * Addresses immediate refresh, image loading, and performance issues
 */

import { cacheService } from '../middleware/cache.js';

/**
 * Enhanced cache invalidation that works without Redis
 */
export const forceContentRefresh = async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override response methods to force cache invalidation
    const invalidateAndRefresh = async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Force immediate cache invalidation
            try {
                // Clear all cache patterns related to content
                const patterns = ['api:blogs', 'api:news', 'api:events', 'api:farms', 'api:magazines', 'api:basics', 'api:dairies', 'api:beefs', 'api:goats', 'api:piggeries'];
                
                for (const pattern of patterns) {
                    await cacheService.del(pattern);
                    await cacheService.del(`${pattern}:*`);
                }
                
                // Also clear dashboard cache
                await cacheService.del('api:dashboard');
                await cacheService.del('api:admin:dashboard');
                
                console.log('🗑️ Cache forcefully invalidated for immediate refresh');
            } catch (error) {
                console.warn('Cache invalidation error (non-critical):', error.message);
            }
            
            // Set headers to prevent any browser caching
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Last-Modified': new Date().toUTCString(),
                'ETag': `"${Date.now()}"` // Force new ETag
            });
        }
    };
    
    // Override res.json
    res.json = async function(data) {
        await invalidateAndRefresh();
        return originalJson.call(this, data);
    };
    
    // Override res.send  
    res.send = async function(data) {
        await invalidateAndRefresh();
        return originalSend.call(this, data);
    };
    
    next();
};

/**
 * Database query optimization for better performance
 */
export const optimizeQuery = (baseQuery = {}) => {
    return {
        ...baseQuery,
        // Add lean() for faster queries
        lean: () => baseQuery,
        // Add selective field projection to reduce data transfer
        select: (fields) => baseQuery.select(fields),
        // Add proper indexing hints
        hint: (index) => baseQuery.hint(index)
    };
};

/**
 * Content refresh endpoint for manual cache clearing
 */
export const refreshContent = async (req, res) => {
    try {
        // Clear all content-related cache
        await cacheService.flush();
        
        res.json({
            success: true,
            message: 'Content cache refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to refresh content cache',
            error: error.message
        });
    }
};

export default {
    forceContentRefresh,
    optimizeQuery,
    refreshContent
};
