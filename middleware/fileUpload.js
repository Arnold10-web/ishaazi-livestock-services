import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure necessary upload directories exist
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    } catch (error) {
      console.error('Error generating file name:', error.message);
      cb(error, null);
    }
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  try {
    const allowedImageTypes = /\.(jpeg|jpg|png|gif|webp)$/i;
    const allowedPdfTypes = /\.pdf$/i;
    const allowedMediaTypes = /\.(mp3|mp4|wav|avi|mov|wmv)$/i;

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileType = file.mimetype;

    console.log(`Received file: ${file.originalname}`);
    console.log(`Field name: ${file.fieldname}`);
    console.log(`File extension: ${fileExtension}`);
    console.log(`File MIME type: ${fileType}`);

    if (file.fieldname === 'image' && allowedImageTypes.test(fileExtension)) {
      cb(null, true);
    } else if (file.fieldname === 'pdf' && allowedPdfTypes.test(fileExtension)) {
      cb(null, true);
    } else if (file.fieldname === 'media' && allowedMediaTypes.test(fileExtension)) {
      cb(null, true);
    } else {
      const errorMessage = `Invalid file type for field "${file.fieldname}". Allowed types: 
      images (jpeg, jpg, png, gif, webp), 
      PDFs, 
      audio (mp3, wav), 
      video (mp4, avi, mov, wmv)`;
      console.error(errorMessage);
      cb(new Error(errorMessage), false);
    }
  } catch (error) {
    console.error('Error filtering file:', error.message);
    cb(error, false);
  }
};


// File size limits
const limits = {
  fileSize: 500 * 1024 * 1024, // 500MB max file size
};

// Multer configuration with added error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

export default upload;
