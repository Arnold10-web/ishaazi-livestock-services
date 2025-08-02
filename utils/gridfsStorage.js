/**
 * GridFS Storage Implementation
 * Using existing mongoose connection
 */
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import crypto from 'crypto';

export class GridFSStorage {
  constructor() {
    this.bucket = null;
  }

  async connect() {
    if (!this.bucket) {
      // Wait for mongoose connection if it's in connecting state
      if (mongoose.connection.readyState === 2) { // connecting
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }
      
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Mongoose connection not ready. Current state: ' + mongoose.connection.readyState);
      }
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected. Ensure mongoose is connected first.');
      }
      this.bucket = new GridFSBucket(db, {
        bucketName: 'uploads'
      });
    }
    return this.bucket;
  }

  generateFilename(file) {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop();
    return `${file.fieldname}-${timestamp}-${randomBytes}.${ext}`;
  }

  async store(file) {
    const bucket = await this.connect();
    const filename = this.generateFilename(file);
    
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: {
        originalname: file.originalname,
        fieldname: file.fieldname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size
      }
    });

    const readStream = Readable.from(file.buffer);
    await new Promise((resolve, reject) => {
      readStream
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    return {
      id: uploadStream.id,
      filename,
      contentType: file.mimetype
    };
  }

  async retrieve(filename) {
    const bucket = await this.connect();
    return bucket.openDownloadStreamByName(filename);
  }

  async delete(filename) {
    const bucket = await this.connect();
    const file = await bucket.find({ filename }).next();
    if (file) {
      await bucket.delete(file._id);
    }
  }
}

const gridFSStorage = new GridFSStorage();

export default gridFSStorage;
