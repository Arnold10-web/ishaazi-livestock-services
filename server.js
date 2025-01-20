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

// Updated CORS configuration
const corsOrigin = process.env.NODE_ENV === 'production'
  ? ['https://ishaazilivestockservices.com', 'https://ishaazi-livestock-services.onrender.com']
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];
console.log('CORS Origin:', corsOrigin);

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

// Add these headers explicitly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});
// Apply helmet after CORS
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection with error logging
connectDB().catch((err) => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads images directory created.');
}

// Serve static files
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.jpg')) res.set('Content-Type', 'image/jpeg');
      else if (filePath.endsWith('.png')) res.set('Content-Type', 'image/png');
      else if (filePath.endsWith('.gif')) res.set('Content-Type', 'image/gif');
      else if (filePath.endsWith('.webp')) res.set('Content-Type', 'image/webp');
      else res.set('Content-Type', 'application/octet-stream');
    },
  })
);

// Add this before your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
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

// Enhanced error logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global error-handling middleware with enhanced logging
app.use((err, req, res, next) => {
  console.error(`Error ${new Date().toISOString()}: ${err.message}`);
  console.error('Stack:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Updated port configuration for cPanel
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => { 
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS Origins:', corsOrigin);
});

export default app;