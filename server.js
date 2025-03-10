import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import upload from './middleware/fileUpload.js';

// Log Node.js version
console.log('Node version:', process.version);

// Create __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS Configuration
const whitelist = [
  'https://ishaazilivestockservices.com',
  'https://www.ishaazilivestockservices.com',
  'https://ishaazi-livestock-services-production.up.railway.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    console.log("Request origin:", origin); // For debugging
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin); // For debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'Accept', 'Origin', 'if-none-match', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'], // Expose headers for video streaming
}));

app.options('*', cors());

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid blocking resources
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resource sharing
}));

// Parse incoming requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
connectDB()
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, 'uploads', 'images');
const mediaDir = path.join(__dirname, 'uploads', 'media');
const pdfsDir = path.join(__dirname, 'uploads', 'pdfs');

[uploadsDir, mediaDir, pdfsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${dir} directory created.`);
  }
});

// Middleware for handling video streaming with range requests
app.get('/uploads/media/:filename', (req, res) => {
  const videoPath = path.join(__dirname, 'uploads', 'media', req.params.filename);
  
  // Check if file exists
  fs.stat(videoPath, (err, stats) => {
    if (err) {
      console.error(`Error accessing file: ${err.message}`);
      return res.status(404).send('File not found');
    }
    
    // Get file size
    const fileSize = stats.size;
    const range = req.headers.range;
    
    // Set CORS headers for video streaming
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://ishaazilivestockservices.com');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Get file extension for content type
    const ext = path.extname(videoPath).toLowerCase();
    const contentTypeMap = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Handle range requests (for video streaming)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      
      console.log(`Range request: ${start}-${end}/${fileSize}`);
      
      // Set response headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      
      // Create read stream for the specified range
      const fileStream = fs.createReadStream(videoPath, { start, end });
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
    } else {
      // If no range is specified, send the entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      
      // Create read stream for the entire file
      const fileStream = fs.createReadStream(videoPath);
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
    }
  });
});

// Serve static files with proper headers
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav'
      };
      
      // Set Content-Type
      res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      
      // Set CORS headers
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // For media files, set range request headers
      if (['.mp4', '.webm', '.ogg', '.mov', '.mp3', '.wav'].includes(ext)) {
        res.set('Accept-Ranges', 'bytes');
      }
    }
  })
);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method !== 'GET') console.log('Body:', req.body);
  next();
});

// Import routes
import adminRoutes from './routes/adminRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File upload failed', error: 'No file provided' });
  }
  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      path: `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Online Farming Magazine API');
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(`Error ${new Date().toISOString()}:`);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Port configuration for cPanel
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
});

export default app;