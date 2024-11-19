const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware for CORS, Security, and JSON parsing
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(helmet());
app.use(express.json());

// Database Connection
connectDB();

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
    try {
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection('uploads'); // Specify the collection used for files
        console.log('GridFS Initialized');
    } catch (error) {
        console.error('Error initializing GridFS:', error);
    }
});

// GridFS Storage for File Uploads
const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => ({
        filename: `${Date.now()}-${file.originalname}`,
        bucketName: 'uploads',
    }),
});

const upload = multer({ storage });

// Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File upload failed', error: 'No file provided' });
    }
    const { originalname, mimetype, id } = req.file;

    console.log(`File Uploaded: ${originalname} (${mimetype})`);

    res.status(201).json({
        message: 'File uploaded successfully',
        file: { id, name: originalname, type: mimetype },
    });
});

// Basic route to test server
app.get('/', (req, res) => {
    res.send("Welcome to the Online Farming Magazine API");
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`Error: ${err.message}\nStack: ${err.stack}`);
    res.status(500).json({ message: 'Server encountered an error', error: err.message });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
