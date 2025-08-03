/**
 * Enhanced File Serving for Railway Production
 * Optimized for cloud deployment with better error handling and performance
 */

import gridFSStorage from '../utils/gridfsStorage.js';
import mongoose from 'mongoose';

/**
 * Enhanced file serving with Railway-specific optimizations
 */
export const enhancedFileServing = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format early
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID format'
            });
        }

        await gridFSStorage.connect();
        const gfs = gridFSStorage.bucket;
        
        // Find file metadata first
        const files = await gfs.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                fileId: id
            });
        }

        const file = files[0];
        
        // Set appropriate headers for Railway production
        res.set({
            'Content-Type': file.contentType || 'application/octet-stream',
            'Content-Length': file.length,
            'Cache-Control': 'public, max-age=31536000', // 1 year cache
            'ETag': `"${file.md5}"`,
            'Last-Modified': file.uploadDate.toUTCString(),
            'Accept-Ranges': 'bytes'
        });

        // Handle range requests for better performance
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${file.length}`,
                'Content-Length': chunksize
            });

            const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(id), {
                start,
                end: end + 1
            });
            
            downloadStream.pipe(res);
        } else {
            // Full file download
            const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(id));
            
            downloadStream.on('error', (error) => {
                console.error('GridFS download error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error streaming file',
                        error: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }
            });

            downloadStream.pipe(res);
        }

    } catch (error) {
        console.error('Enhanced file serving error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

export default enhancedFileServing;
