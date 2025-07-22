/**
 * GridFS Storage Implementation
 * Using native MongoDB GridFS support
 */
import { MongoClient } from 'mongodb';
import { Readable } from 'stream';
import crypto from 'crypto';

export class GridFSStorage {
  constructor(mongoUrl, dbName) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
    this.bucket = null;
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      this.client = await MongoClient.connect(this.mongoUrl);
      const db = this.client.db(this.dbName);
      this.bucket = new db.GridFSBucket({
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

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.bucket = null;
    }
  }
}

const gridFSStorage = new GridFSStorage(
  process.env.MONGODB_URI,
  process.env.MONGODB_DB_NAME || 'ishaazi-livestock'
);

export default gridFSStorage;
