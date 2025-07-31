/**
 * @file File Management Controller
 * @description GridFS file browser and management for system admins
 * @module controllers/fileManagementController
 */

import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import ActivityLog from '../models/ActivityLog.js';

let gfsBucket;

// Initialize GridFS bucket
const initGridFS = () => {
    if (!gfsBucket && mongoose.connection.readyState === 1) {
        gfsBucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
    }
    return gfsBucket;
};

/**
 * Get all files with pagination and filters
 */
export const getFiles = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        const { 
            page = 1, 
            limit = 20, 
            type, 
            search,
            sortBy = 'uploadDate',
            sortOrder = 'desc' 
        } = req.query;
        
        // Build aggregation pipeline
        const pipeline = [];
        
        // Match stage for filtering
        const matchStage = {};
        if (type) {
            matchStage.contentType = new RegExp(type, 'i');
        }
        if (search) {
            matchStage.filename = new RegExp(search, 'i');
        }
        
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        
        // Sort stage
        const sortStage = {};
        sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
        pipeline.push({ $sort: sortStage });
        
        // Pagination
        pipeline.push({ $skip: (page - 1) * parseInt(limit) });
        pipeline.push({ $limit: parseInt(limit) });
        
        // Add metadata
        pipeline.push({
            $addFields: {
                sizeFormatted: {
                    $switch: {
                        branches: [
                            { case: { $lt: ['$length', 1024] }, then: { $concat: [{ $toString: '$length' }, ' B'] } },
                            { case: { $lt: ['$length', 1048576] }, then: { $concat: [{ $toString: { $round: [{ $divide: ['$length', 1024] }, 2] } }, ' KB'] } },
                            { case: { $lt: ['$length', 1073741824] }, then: { $concat: [{ $toString: { $round: [{ $divide: ['$length', 1048576] }, 2] } }, ' MB'] } }
                        ],
                        default: { $concat: [{ $toString: { $round: [{ $divide: ['$length', 1073741824] }, 2] } }, ' GB'] }
                    }
                }
            }
        });
        
        const files = await bucket.find().aggregate(pipeline).toArray();
        
        // Get total count for pagination
        const totalPipeline = [];
        if (Object.keys(matchStage).length > 0) {
            totalPipeline.push({ $match: matchStage });
        }
        totalPipeline.push({ $count: 'total' });
        
        const totalResult = await bucket.find().aggregate(totalPipeline).toArray();
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        
        // Get storage statistics
        const storageStats = await bucket.find().aggregate([
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$length' },
                    avgSize: { $avg: '$length' },
                    maxSize: { $max: '$length' },
                    minSize: { $min: '$length' }
                }
            }
        ]).toArray();
        
        const stats = storageStats.length > 0 ? storageStats[0] : {
            totalFiles: 0,
            totalSize: 0,
            avgSize: 0,
            maxSize: 0,
            minSize: 0
        };
        
        res.json({
            success: true,
            data: {
                files,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                stats
            }
        });
        
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch files',
            error: error.message
        });
    }
};

/**
 * Get file details by ID
 */
export const getFileDetails = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        const { fileId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }
        
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        
        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        
        const file = files[0];
        
        // Add formatted size
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
            if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
            return (bytes / 1073741824).toFixed(2) + ' GB';
        };
        
        const fileDetails = {
            ...file,
            sizeFormatted: formatSize(file.length),
            isImage: file.contentType && file.contentType.startsWith('image/'),
            isVideo: file.contentType && file.contentType.startsWith('video/'),
            isAudio: file.contentType && file.contentType.startsWith('audio/'),
            isPDF: file.contentType === 'application/pdf'
        };
        
        res.json({
            success: true,
            data: fileDetails
        });
        
    } catch (error) {
        console.error('Error fetching file details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch file details',
            error: error.message
        });
    }
};

/**
 * Delete file by ID
 */
export const deleteFile = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        const { fileId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }
        
        // Get file details before deletion for logging
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        
        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        
        const file = files[0];
        
        // Delete the file
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'file_deleted',
            resource: 'file',
            resourceId: fileId,
            details: {
                filename: file.filename,
                contentType: file.contentType,
                size: file.length,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        res.json({
            success: true,
            message: 'File deleted successfully',
            data: {
                deletedFile: {
                    id: fileId,
                    filename: file.filename,
                    size: file.length
                }
            }
        });
        
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error.message
        });
    }
};

/**
 * Bulk delete files
 */
export const bulkDeleteFiles = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        const { fileIds } = req.body;
        
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File IDs array is required'
            });
        }
        
        const validIds = fileIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const deletedFiles = [];
        const errors = [];
        
        for (const fileId of validIds) {
            try {
                // Get file details before deletion
                const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
                
                if (files.length > 0) {
                    const file = files[0];
                    await bucket.delete(new mongoose.Types.ObjectId(fileId));
                    deletedFiles.push({
                        id: fileId,
                        filename: file.filename,
                        size: file.length
                    });
                } else {
                    errors.push(`File ${fileId} not found`);
                }
            } catch (error) {
                errors.push(`Failed to delete file ${fileId}: ${error.message}`);
            }
        }
        
        // Log bulk deletion activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'files_bulk_deleted',
            resource: 'file',
            details: {
                deletedCount: deletedFiles.length,
                errorCount: errors.length,
                deletedFiles: deletedFiles.map(f => f.filename),
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: errors.length === 0 ? 'success' : 'partial_success',
            severity: 3
        });
        
        res.json({
            success: true,
            message: `Successfully deleted ${deletedFiles.length} files`,
            data: {
                deletedFiles,
                errors,
                summary: {
                    total: fileIds.length,
                    deleted: deletedFiles.length,
                    errors: errors.length
                }
            }
        });
        
    } catch (error) {
        console.error('Error bulk deleting files:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete files',
            error: error.message
        });
    }
};

/**
 * Get file storage statistics
 */
export const getStorageStats = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        // Overall statistics
        const overallStats = await bucket.find().aggregate([
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$length' },
                    avgSize: { $avg: '$length' },
                    maxSize: { $max: '$length' },
                    minSize: { $min: '$length' }
                }
            }
        ]).toArray();
        
        // Statistics by content type
        const typeStats = await bucket.find().aggregate([
            {
                $group: {
                    _id: '$contentType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$length' },
                    avgSize: { $avg: '$length' }
                }
            },
            { $sort: { totalSize: -1 } }
        ]).toArray();
        
        // Upload timeline (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const uploadTimeline = await bucket.find().aggregate([
            {
                $match: {
                    uploadDate: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' } },
                    uploads: { $sum: 1 },
                    totalSize: { $sum: '$length' }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();
        
        const stats = overallStats.length > 0 ? overallStats[0] : {
            totalFiles: 0,
            totalSize: 0,
            avgSize: 0,
            maxSize: 0,
            minSize: 0
        };
        
        // Format sizes
        const formatSize = (bytes) => {
            if (bytes < 1024) return { value: bytes, unit: 'B' };
            if (bytes < 1048576) return { value: (bytes / 1024).toFixed(2), unit: 'KB' };
            if (bytes < 1073741824) return { value: (bytes / 1048576).toFixed(2), unit: 'MB' };
            return { value: (bytes / 1073741824).toFixed(2), unit: 'GB' };
        };
        
        res.json({
            success: true,
            data: {
                overall: {
                    ...stats,
                    totalSizeFormatted: formatSize(stats.totalSize),
                    avgSizeFormatted: formatSize(stats.avgSize),
                    maxSizeFormatted: formatSize(stats.maxSize),
                    minSizeFormatted: formatSize(stats.minSize)
                },
                byType: typeStats.map(type => ({
                    ...type,
                    totalSizeFormatted: formatSize(type.totalSize),
                    avgSizeFormatted: formatSize(type.avgSize)
                })),
                uploadTimeline
            }
        });
        
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch storage statistics',
            error: error.message
        });
    }
};

/**
 * Clean up orphaned files
 */
export const cleanupOrphanedFiles = async (req, res) => {
    try {
        const bucket = initGridFS();
        if (!bucket) {
            return res.status(500).json({
                success: false,
                message: 'GridFS not initialized'
            });
        }
        
        // This is a placeholder for orphaned file cleanup logic
        // In a real implementation, you would:
        // 1. Get all file IDs from GridFS
        // 2. Check which files are referenced in your content models
        // 3. Identify orphaned files (files not referenced anywhere)
        // 4. Optionally delete them
        
        const { dryRun = true } = req.query;
        
        // For now, return a simulation
        const orphanedFiles = [];
        const cleanupResults = {
            scanned: 0,
            orphaned: orphanedFiles.length,
            deleted: dryRun ? 0 : orphanedFiles.length,
            savedSpace: 0,
            dryRun: dryRun === 'true'
        };
        
        // Log cleanup activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'file_cleanup_executed',
            resource: 'file',
            details: {
                ...cleanupResults,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        res.json({
            success: true,
            message: dryRun ? 'Cleanup simulation completed' : 'Cleanup completed',
            data: cleanupResults
        });
        
    } catch (error) {
        console.error('Error during file cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup files',
            error: error.message
        });
    }
};
