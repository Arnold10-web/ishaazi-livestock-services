import { getGridFSFileStream, getGridFSFileInfo } from '../utils/gridFSUtils.js';

/**
 * Stream a file from GridFS
 * @route GET /api/files/:fileId
 */
export const streamFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Get file metadata first
        const fileInfo = await getGridFSFileInfo(fileId);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Set appropriate headers
        res.set('Content-Type', fileInfo.contentType);
        res.set('Content-Length', fileInfo.length);
        
        // If it's an image that should be displayed in browser
        if (fileInfo.contentType.startsWith('image/')) {
            res.set('Content-Disposition', 'inline');
        } else {
            // For other files, prompt download
            res.set('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
        }

        // Stream the file
        const stream = await getGridFSFileStream(fileId);
        stream.pipe(res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error streaming file',
            error: error.message
        });
    }
};
