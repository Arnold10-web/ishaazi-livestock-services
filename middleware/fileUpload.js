import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('Missing AWS S3 configuration. Please check your environment variables.');
}

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define allowed file types
const allowedTypes = {
  image: /\.(jpeg|jpg|png|gif|webp)$/i,
  pdf: /\.pdf$/i,
  media: /\.(mp3|mp4|wav|avi|mov|wmv)$/i,
};

// File filter function
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.image.test(fileExt) && file.fieldname === 'image') {
    cb(null, true);
  } else if (allowedTypes.pdf.test(fileExt) && file.fieldname === 'pdf') {
    cb(null, true);
  } else if (allowedTypes.media.test(fileExt) && file.fieldname === 'media') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field "${file.fieldname}".`), false);
  }
};

// Multer S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read', // Change to 'private' if needed
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const folder = file.fieldname === 'image' ? 'images/' :
                     file.fieldname === 'pdf' ? 'pdfs/' :
                     file.fieldname === 'media' ? 'media/' : 'others/';
      cb(null, `${folder}${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export default upload;