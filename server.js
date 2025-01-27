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

// Open CORS policy for now
app.use(cors({ origin: '*' }));

app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request from: ${req.headers.origin}`);
  next();
});

// Apply security headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

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
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    }
  })
);

// Request logger
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
