/**
 * Comprehensive Performance and Cache Fix
 * Addresses immediate refresh, image serving, and API performance issues
 */
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { invalidateCache } from '../middleware/cache.js';

// Enhanced cache invalidation for immediate refresh
export const forceContentRefresh = (contentTypes = []) => {
    return async (req, res, next) => {
        try {
            // Store the original json method
            const originalJson = res.json.bind(res);
            
            // Override json method to clear cache before response
            res.json = function(data) {
                // Clear all relevant caches immediately
                const allTypes = ['blogs', 'news', 'magazines', 'events', 'farms', 'piggeries', 'dairies', 'beefs', 'goats', ...contentTypes];
                invalidateCache(allTypes);
                
                // Force client-side cache clear
                res.set({
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'X-Content-Refreshed': Date.now()
                });
                
                return originalJson(data);
            };
            
            next();
        } catch (error) {
            console.error('Force refresh middleware error:', error);
            next();
        }
    };
};

// Enhanced file serving with better error handling and validation
export const enhancedFileServing = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Enhanced file ID validation
        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            console.log(`Invalid file ID format: ${fileId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID format'
            });
        }
        
        // Ensure database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected for file serving');
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable'
            });
        }
        
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        
        // Check if file exists
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        
        if (!files || files.length === 0) {
            console.log(`File not found in GridFS: ${fileId}`);
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        
        const fileInfo = files[0];
        
        // Set appropriate headers for better caching and display
        res.set({
            'Content-Type': fileInfo.contentType || 'application/octet-stream',
            'Content-Length': fileInfo.length,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'ETag': `"${fileInfo._id}"`,
            'Last-Modified': fileInfo.uploadDate.toUTCString()
        });
        
        // Handle conditional requests
        const clientETag = req.get('If-None-Match');
        if (clientETag === `"${fileInfo._id}"`) {
            return res.status(304).end();
        }
        
        // Set content disposition based on file type
        if (fileInfo.contentType && fileInfo.contentType.startsWith('image/')) {
            res.set('Content-Disposition', 'inline');
        } else {
            const filename = fileInfo.filename || fileInfo.metadata?.originalname || 'download';
            res.set('Content-Disposition', `attachment; filename="${filename}"`);
        }
        
        // Create and pipe the stream
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
        
        downloadStream.on('error', (error) => {
            console.error('GridFS download stream error:', error);
            if (!res.headersSent) {
                res.status(404).json({
                    success: false,
                    message: 'File stream error'
                });
            }
        });
        
        downloadStream.pipe(res);
        
    } catch (error) {
        console.error('Enhanced file serving error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error serving file',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// Database query optimization helper
export const optimizeQuery = (model, query = {}, options = {}) => {
    return model
        .find(query, null, options)
        .lean() // Return plain objects instead of Mongoose documents
        .hint({ _id: 1 }) // Use _id index for better performance
        .maxTimeMS(5000); // Set 5 second timeout
};

// Pagination helper with performance optimization
export const optimizedPagination = (model, query = {}, page = 1, limit = 10, sort = { createdAt: -1 }) => {
    const skip = (page - 1) * limit;
    
    return Promise.all([
        model.countDocuments(query).maxTimeMS(3000),
        model
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(5000)
    ]).then(([total, items]) => ({
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        }
    }));
};

// Content refresh endpoint for manual cache clearing
export const refreshContent = async (req, res) => {
    try {
        const { types } = req.body;
        const contentTypes = types || ['blogs', 'news', 'magazines', 'events', 'farms', 'piggeries', 'dairies', 'beefs', 'goats'];
        
        // Clear cache
        invalidateCache(contentTypes);
        
        res.json({
            success: true,
            message: 'Content cache refreshed',
            timestamp: Date.now(),
            clearedTypes: contentTypes
        });
    } catch (error) {
        console.error('Content refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing content cache'
        });
    }
};

// Performance monitoring middleware
export const performanceMonitor = (operation = 'unknown') => {
    return (req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            if (duration > 1000) { // Log slow requests (>1s)
                console.warn(`Slow ${operation} request: ${duration}ms for ${req.method} ${req.originalUrl}`);
            }
        });
        
        next();
    };
};

// File validation helper for uploads
export const validateFileExists = async (fileId) => {
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
        return false;
    }
    
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).limit(1).toArray();
        return files.length > 0;
    } catch (error) {
        console.error('File validation error:', error);
        return false;
    }
};

// Batch file cleanup for deleted content
export const cleanupOrphanedFiles = async (fileIds = []) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        
        for (const fileId of fileIds.filter(id => mongoose.Types.ObjectId.isValid(id))) {
            try {
                await bucket.delete(new mongoose.Types.ObjectId(fileId));
                console.log(`Cleaned up orphaned file: ${fileId}`);
            } catch (error) {
                console.warn(`Failed to cleanup file ${fileId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Batch file cleanup error:', error);
    }
};

export default {
    forceContentRefresh,
    enhancedFileServing,
    optimizeQuery,
    optimizedPagination,
    refreshContent,
    performanceMonitor,
    validateFileExists,
    cleanupOrphanedFiles
};
