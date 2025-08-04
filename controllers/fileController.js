import { getGridFSFileStream, getGridFSFileInfo } from '../utils/gridFSUtils.js';
import mongoose from 'mongoose';

/**
 * Stream a file from GridFS
 * @route GET /api/files/:fileId
 */
export const streamFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Enhanced file ID validation - MongoDB ObjectId format (24 hex characters)
        if (!fileId || !fileId.match(/^[0-9a-fA-F]{24}$/i)) {
            console.log(`Invalid file ID format: ${fileId} (length: ${fileId?.length})`);
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID format'
            });
        }

        // Additional ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            console.log(`Invalid MongoDB ObjectId: ${fileId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID format'
            });
        }
        
        // Get file metadata first
        const fileInfo = await getGridFSFileInfo(fileId);
        if (!fileInfo) {
            console.log(`File not found in GridFS: ${fileId}`);
            
            // Set no-cache headers for 404 responses to prevent caching broken images
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            
            return res.status(404).json({
                success: false,
                message: 'File not found',
                fileId: fileId
            });
        }

        // Set appropriate headers
        res.set('Content-Type', fileInfo.contentType || 'application/octet-stream');
        res.set('Content-Length', fileInfo.length);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        
        // If it's an image that should be displayed in browser
        if (fileInfo.contentType && fileInfo.contentType.startsWith('image/')) {
            res.set('Content-Disposition', 'inline');
        } else {
            // For other files, prompt download
            res.set('Content-Disposition', `attachment; filename="${fileInfo.filename || 'download'}"`);
        }

        // Stream the file
        const stream = await getGridFSFileStream(fileId);
        
        // Handle stream errors
        stream.on('error', (error) => {
            console.error('GridFS stream error:', error);
            if (!res.headersSent) {
                res.status(404).json({
                    success: false,
                    message: 'File stream error'
                });
            }
        });
        
        stream.pipe(res);
    } catch (error) {
        console.error('File streaming error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error streaming file',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};
