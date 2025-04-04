import multer from 'multer';
import path from 'path';
import fs from 'fs';

// CHANGED: Updated paths to use Railway volume directly
const imageDir = '/uploads/images';
const pdfDir = '/uploads/pdfs';
const mediaDir = '/uploads/media';

// Ensure volume directories exist
[imageDir, pdfDir, mediaDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
      console.error('Error determining destination:', error.message);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedPdfTypes = /\.pdf$/i;
  const allowedMediaTypes = /\.(mp3|mp4|wav|avi|mov|wmv)$/i;
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'image' && allowedImageTypes.test(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'pdf' && allowedPdfTypes.test(ext)) {
    cb(null, true);
  } else if (file.fieldname === 'media' && allowedMediaTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field "${file.fieldname}"`), false);
  }
};

const limits = {
  fileSize: 500 * 1024 * 1024 // 500MB limit (confirmed)
};

// CHANGED: Fixed export syntax (removed redundant parentheses)
export default multer({ storage, fileFilter, limits });
