/**
 * Force Refresh Middleware
 * Ensures immediate cache invalidation and content refresh for admin operations
 */

/**
 * Middleware to force immediate content refresh after creation/update operations
 * This prevents the need for multiple refreshes on the admin side
 */
export const forceAdminRefresh = () => {
  return async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override response methods to add cache invalidation
    const enhanceResponse = (originalMethod) => {
      return function(data) {
        // Set aggressive no-cache headers for admin responses
        this.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString(),
          'ETag': `"${Date.now()}"`,
          'X-Force-Refresh': 'true',
          'X-Admin-Cache': 'invalidated'
        });
        
        // Call original method
        return originalMethod.call(this, data);
      };
    };
    
    res.json = enhanceResponse(originalJson);
    res.send = enhanceResponse(originalSend);
    
    next();
  };
};

/**
 * Force cache clear for specific content types
 */
export const forceCacheInvalidation = (contentTypes = []) => {
  return async (req, res, next) => {
    try {
      // Clear all memory caches
      if (global.memoryCache) {
        global.memoryCache.flushAll();
      }
      
      // Clear enhanced cache with specific patterns
      const { invalidateCache } = await import('./enhancedCache.js');
      const defaultTypes = ['content', 'dashboard', 'admin'];
      const allTypes = [...defaultTypes, ...contentTypes];
      
      await invalidateCache(allTypes);
      
      console.log('🗑️ Cache forcefully invalidated for types:', allTypes);
      
    } catch (error) {
      console.warn('Cache invalidation warning (non-critical):', error.message);
    }
    
    next();
  };
};

/**
 * Complete admin refresh middleware that combines cache invalidation and headers
 */
export const completeAdminRefresh = (contentTypes = []) => {
  return [
    forceCacheInvalidation(contentTypes),
    forceAdminRefresh()
  ];
};

export default {
  forceAdminRefresh,
  forceCacheInvalidation,
  completeAdminRefresh
};
