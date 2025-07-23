/**
 * Enhanced File Upload Middleware
 * Using GridFS for secure file storage
 */
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import gridFSStorage from '../utils/gridfsStorage.js';

// File type validation
const allowedTypes = {
  image: {
    extensions: ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf']
  },
  media: {
    extensions: ['.mp3', '.mp4', '.wav', '.avi', '.mov', '.wmv'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv']
  }
};

// Enhanced file filter with security checks
const fileFilter = (req, file, cb) => {
  try {
    const fieldType = file.fieldname === 'fileImage' ? 'image' : file.fieldname;
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = allowedTypes[fieldType];

    if (!allowed) {
      return cb(new Error(`Invalid field type: ${fieldType}`), false);
    }

    // Security: Check file extension and MIME type
    const isValidExt = allowed.extensions.includes(ext);
    const isValidMime = allowed.mimeTypes.includes(file.mimetype);

    if (!isValidExt || !isValidMime) {
      return cb(new Error('Invalid file type'), false);
    }

    // Security: Check for suspicious extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js'];
    if (suspiciousExtensions.some(badExt => file.originalname.toLowerCase().includes(badExt))) {
      return cb(new Error('Potentially harmful file type'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Create multer instance with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5
  }
});

// Media upload configuration
export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
});

// GridFS storage middleware (after multer processing)
const gridFSStorageMiddleware = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? Object.values(req.files).flat() : [req.file];
    const storedFiles = [];

    for (const file of files.filter(Boolean)) {
      // For images, optimize before storing
      if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif') {
        const optimized = await sharp(file.buffer)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        
        file.buffer = optimized;
        file.mimetype = 'image/webp';
      }

      const stored = await gridFSStorage.store(file);
      storedFiles.push(stored);
    }

    // Attach stored file info to request
    if (req.file) {
      req.file.gridFS = storedFiles[0];
    }
    if (req.files) {
      req.files.gridFS = storedFiles;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Function that returns middleware chain for file upload + GridFS storage
export const storeInGridFS = (fieldName, allowedMimeTypes = [], options = {}) => {
  // Create multer instance with specific field and file type filtering
  const uploadInstance = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      // Check if field matches
      if (file.fieldname !== fieldName) {
        return cb(new Error(`Invalid field name. Expected: ${fieldName}`), false);
      }

      // If specific mime types are provided, check them
      if (allowedMimeTypes.length > 0) {
        const isAllowed = allowedMimeTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.mimetype.startsWith(type.replace('/*', '/'));
          }
          return file.mimetype === type;
        });
        
        if (!isAllowed) {
          return cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`), false);
        }
      }

      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5
    }
  });

  // If optional is true, wrap the upload middleware to handle no file gracefully
  const uploadMiddleware = options.optional 
    ? (req, res, next) => {
        uploadInstance.single(fieldName)(req, res, (err) => {
          // If no file provided and it's optional, just continue
          if (err && err.message.includes('Unexpected field')) {
            return next();
          }
          if (err) return next(err);
          next();
        });
      }
    : uploadInstance.single(fieldName);

  // Return middleware chain: multer upload + GridFS storage
  return [uploadMiddleware, gridFSStorageMiddleware];
};

export default upload;
