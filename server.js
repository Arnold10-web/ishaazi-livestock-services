import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import upload from './middleware/fileUpload.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Create __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply helmet after CORS
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
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

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Online Farming Magazine API');
});

// Debug middleware (enabled only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.file) {
      console.log('Uploaded file details:', req.file);
    }
    next();
  });
}

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
