/**
 * GridFS Utilities
 * Provides helper functions for working with GridFS files
 */
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

// Get GridFS bucket instance
const getBucket = () => {
    const db = mongoose.connection.db;
    return new GridFSBucket(db);
};

/**
 * Delete a file from GridFS by ID
 * @param {string} fileId - The ObjectId of the file to delete
 */
export const deleteGridFSFile = async (fileId) => {
    if (!fileId) return;
    
    try {
        const bucket = getBucket();
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (error) {
        console.error('Error deleting file from GridFS:', error);
        // Don't throw error to prevent blocking operations if file deletion fails
    }
};

/**
 * Get a file stream from GridFS
 * @param {string} fileId - The ObjectId of the file to stream
 * @returns {Promise<Stream>} A readable stream of the file
 */
export const getGridFSFileStream = async (fileId) => {
    const bucket = getBucket();
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

/**
 * Get file information from GridFS
 * @param {string} fileId - The ObjectId of the file
 * @returns {Promise<Object>} File metadata
 */
export const getGridFSFileInfo = async (fileId) => {
    const bucket = getBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files[0];
};

/**
 * Update a file in GridFS
 * @param {string} oldFileId - The ObjectId of the file to replace
 * @param {string} newFileId - The ObjectId of the new file
 */
export const updateGridFSFile = async (oldFileId, newFileId) => {
    if (oldFileId) {
        await deleteGridFSFile(oldFileId);
    }
    return newFileId;
};
