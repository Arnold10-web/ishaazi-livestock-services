/**
 * File Upload Middleware
 * 
 * This middleware handles secure file uploads for the application including images, PDFs,
 * and media files (audio/video). It provides robust security features including:
 * - Secure random filename generation
 * - MIME type validation
 * - File size limits
 * - Suspicious extension detection
 * - Image optimization
 * 
 * The middleware automatically creates necessary upload directories and provides
 * specialized upload handlers for different content types.
 * 
 * @module middleware/fileUpload
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ensures that a directory exists, creating it if necessary
 * 
 * @param {string} dir - The directory path to check/create
 */
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  }
};

// Define base upload directories
const imageDir = path.join(__dirname, '..', 'uploads', 'images');
const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
const mediaDir = path.join(__dirname, '..', 'uploads', 'media');

ensureDirExists(imageDir);
ensureDirExists(pdfDir);
ensureDirExists(mediaDir);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (file.fieldname === 'image' || file.fieldname === 'fileImage') {
        cb(null, imageDir);
      } else if (file.fieldname === 'pdf') {
        cb(null, pdfDir);
      } else if (file.fieldname === 'media') {
        cb(null, mediaDir);
      } else {
        throw new Error(`Invalid file field: ${file.fieldname}`);
      }
    } catch (error) {
      console.error('Error determining file destination:', error.message);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate secure random filename to prevent directory traversal
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();

      // Sanitize original filename for logging purposes
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

      const secureFilename = `${file.fieldname}-${timestamp}-${randomBytes}${ext}`;

      console.log(`📁 Generating secure filename: ${sanitizedOriginalName} -> ${secureFilename}`);
      cb(null, secureFilename);
    } catch (error) {
      console.error('Error generating file name:', error.message);
      cb(error, null);
    }
  },
});

// Secure file filter with MIME type validation
const fileFilter = (req, file, cb) => {
  try {
    // Define allowed file types with both extension and MIME type validation
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

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Security: Check for double extensions (e.g., file.jpg.exe)
    const fileName = file.originalname.toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];

    if (suspiciousExtensions.some(ext => fileName.includes(ext))) {
      console.warn(`🚨 Suspicious file detected: ${file.originalname} from IP: ${req.ip}`);
      return cb(new Error('File type not allowed for security reasons'), false);
    }

    // Validate file field and type
    const fieldType = file.fieldname === 'fileImage' ? 'image' : file.fieldname;
    const allowedForField = allowedTypes[fieldType];

    if (!allowedForField) {
      return cb(new Error(`Invalid field name: ${file.fieldname}`), false);
    }

    // Check both extension and MIME type
    const extensionValid = allowedForField.extensions.includes(fileExtension);
    const mimeTypeValid = allowedForField.mimeTypes.includes(mimeType);

    if (extensionValid && mimeTypeValid) {
      console.log(`✅ File accepted: ${file.originalname} (${mimeType})`);
      cb(null, true);
    } else {
      const errorMessage = `Invalid file type. Expected ${fieldType} file with valid extension and MIME type.`;
      console.warn(`⚠️  File rejected: ${file.originalname} - Extension: ${fileExtension}, MIME: ${mimeType}`);
      cb(new Error(errorMessage), false);
    }
  } catch (error) {
    console.error('Error filtering file:', error.message);
    cb(error, false);
  }
};


// Image optimization middleware
export const optimizeImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.fieldname.includes('image') && req.file.fieldname !== 'fileImage') {
      return next();
    }

    const inputPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    // Skip optimization for GIFs to preserve animation
    if (ext === '.gif') {
      return next();
    }

    console.log(`🖼️  Optimizing image: ${req.file.filename}`);
    
    // Create optimized versions
    const optimizedPath = inputPath.replace(ext, '_optimized.webp');
    const thumbnailPath = inputPath.replace(ext, '_thumb.webp');
    
    // Main optimized image (max 1200px width, WebP format)
    await sharp(inputPath)
      .resize(1200, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 85,
        effort: 4
      })
      .toFile(optimizedPath);

    // Thumbnail (300px width)
    await sharp(inputPath)
      .resize(300, 200, { 
        fit: 'cover' 
      })
      .webp({ 
        quality: 80,
        effort: 4
      })
      .toFile(thumbnailPath);

    // Update file info to point to optimized version
    req.file.optimizedPath = optimizedPath;
    req.file.thumbnailPath = thumbnailPath;
    req.file.originalPath = inputPath;
    
    console.log(`✅ Image optimization complete: ${req.file.filename}`);
    next();
  } catch (error) {
    console.error('❌ Image optimization failed:', error.message);
    // Continue without optimization if it fails
    next();
  }
};

// Secure file size limits based on file type
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size (reduced for security)
  files: 1, // Only allow one file per request
  fields: 10, // Limit number of fields
  fieldNameSize: 100, // Limit field name size
  fieldSize: 1024 * 1024 // 1MB limit for field values
};

// Multer configuration with added error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

export default upload;
