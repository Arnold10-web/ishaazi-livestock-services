/**
 * Enhanced File Upload Middleware
 * Using GridFS for secure file storage
 */
import multer from 'multer';
import mongoose from 'mongoose';
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

// Helper function for image optimization
const optimizeImage = async (file) => {
  // Add null checks to prevent errors
  if (!file || !file.buffer || !file.mimetype) {
    console.warn('Skipping image optimization: file, buffer, or mimetype is missing');
    return file;
  }
  
  if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif') {
    // Skip optimization for very large files to prevent memory issues
    if (file.buffer.length > 5 * 1024 * 1024) { // 5MB threshold
      console.warn(`Skipping optimization for large image: ${file.originalname}`);
    } else {
      try {
        const optimized = await sharp(file.buffer)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        
        file.buffer = optimized;
        file.mimetype = 'image/webp';
        file.originalname = file.originalname.replace(/\.[^/.]+$/, '.webp');
      } catch (error) {
        console.warn('Image optimization failed:', error.message);
        // Continue with original file if optimization fails
      }
    }
  }
  return file;
};

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
      await optimizeImage(file);

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
      fileSize: (options.maxFileSize && options.maxFileSize > 0) ? options.maxFileSize : 10 * 1024 * 1024, // 10MB default limit
      files: 5
    }
  });

  // Enhanced upload middleware that handles optional files
  const uploadMiddleware = (req, res, next) => {
    uploadInstance.single(fieldName)(req, res, (err) => {
      // If no file provided and it's optional, just continue
      if (err && err.code === 'LIMIT_UNEXPECTED_FILE' && options.optional) {
        return next();
      }
      // Handle multer errors
      if (err) {
        return next(err);
      }
      next();
    });
  };

  // Enhanced GridFS storage middleware with better error handling
  const enhancedGridFSMiddleware = async (req, res, next) => {
    try {
      // If no file uploaded, continue (especially for optional uploads)
      if (!req.file && !req.files) {
        return next();
      }

      // Check if mongoose is connected (readyState === 1)
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }

      const files = req.files ? Object.values(req.files).flat() : [req.file];
      const storedFiles = [];

      for (const file of files.filter(Boolean)) {
        // Add additional null checks before optimization
        if (!file || !file.buffer) {
          console.warn('Skipping file processing: file or buffer is missing');
          continue;
        }
        
        // For images, optimize before storing
        try {
          await optimizeImage(file);
        } catch (optimizeError) {
          console.warn('Image optimization failed, continuing with original file:', optimizeError.message);
        }

        const stored = await gridFSStorage.store(file);
        storedFiles.push(stored);
      }

      // Attach stored file info to request
      if (req.file) {
        req.file.gridFS = storedFiles[0];
        req.file.id = storedFiles[0].id; // Also add id directly for backward compatibility
        req.uploadedFiles = [storedFiles[0]];
        console.log('🔍 GridFS: Stored file with ID:', storedFiles[0].id);
      }
      if (req.files) {
        req.files.gridFS = storedFiles;
        req.uploadedFiles = storedFiles;
      }

      next();
    } catch (error) {
      console.error('GridFS Storage Error:', error);
      next(error);
    }
  };

  // Return middleware chain: multer upload + GridFS storage
  return [uploadMiddleware, enhancedGridFSMiddleware];
};

// Function to handle multiple different file fields (for basic content that needs both image and media)
export const storeMultipleFieldsInGridFS = (fieldConfigs = []) => {
  // fieldConfigs format: [{ fieldName: 'image', allowedMimeTypes: ['image/*'], optional: true }, ...]
  
  const uploadInstance = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      // Find the matching field configuration
      const fieldConfig = fieldConfigs.find(config => config.fieldName === file.fieldname);
      
      if (!fieldConfig) {
        return cb(new Error(`Invalid field name. Expected one of: ${fieldConfigs.map(c => c.fieldName).join(', ')}`), false);
      }

      // Check mime types if specified
      if (fieldConfig.allowedMimeTypes && fieldConfig.allowedMimeTypes.length > 0) {
        const isAllowed = fieldConfig.allowedMimeTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.mimetype.startsWith(type.replace('/*', '/'));
          }
          return file.mimetype === type;
        });
        
        if (!isAllowed) {
          return cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fieldConfig.allowedMimeTypes.join(', ')}`), false);
        }
      }

      cb(null, true);
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max for any file
      files: fieldConfigs.length
    }
  });

  // Use fields() method to handle multiple different field names
  const fieldArray = fieldConfigs.map(config => ({ name: config.fieldName, maxCount: 1 }));
  
  const uploadMiddleware = (req, res, next) => {
    uploadInstance.fields(fieldArray)(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  };

  // Enhanced GridFS storage middleware for multiple fields
  const enhancedMultiFieldGridFSMiddleware = async (req, res, next) => {
    try {
      // If no files uploaded, continue
      if (!req.files || Object.keys(req.files).length === 0) {
        return next();
      }

      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }

      const storedFiles = {};

      // Process each field
      for (const [fieldName, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]; // Take first file for each field
          
          // Optimize images before storing
          try {
            await optimizeImage(file);
          } catch (optimizeError) {
            console.warn(`Image optimization failed for ${fieldName}, continuing with original file:`, optimizeError.message);
          }

          const stored = await gridFSStorage.store(file);
          storedFiles[fieldName] = stored;
          
          console.log(`🔍 GridFS: Stored ${fieldName} file with ID:`, stored.id);
        }
      }

      // Attach stored file info to request for backward compatibility
      req.uploadedFiles = storedFiles;
      
      // Also set req.files with GridFS info for easy access
      for (const [fieldName, stored] of Object.entries(storedFiles)) {
        if (req.files[fieldName]) {
          req.files[fieldName][0].gridFS = stored;
          req.files[fieldName][0].id = stored.id;
        }
      }

      next();
    } catch (error) {
      console.error('GridFS Multi-Field Storage Error:', error);
      next(error);
    }
  };

  return [uploadMiddleware, enhancedMultiFieldGridFSMiddleware];
};

export default upload;
