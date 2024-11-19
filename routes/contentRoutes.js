// routes/contentRoutes.js

const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
    saveMedia,
    createNews, getNews, updateNews, deleteNews,
    createBlog, getBlog, updateBlog, deleteBlog,
    createFarm, getFarm, updateFarm, deleteFarm,
    createMagazine, getMagazine, updateMagazine, deleteMagazine
} = require('../controllers/contentController');

const router = express.Router();

// In-memory storage for media uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Media Management Route ---
router.post('/uploadMedia', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        await saveMedia(req, res);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload media', error });
    }
});

// --- News Routes ---
router.post('/news', authMiddleware, createNews);
router.get('/news', getNews);
router.put('/news/:id', authMiddleware, updateNews);
router.delete('/news/:id', authMiddleware, deleteNews);

// --- Blog Routes ---
router.post('/blog', authMiddleware, createBlog);
router.get('/blog', getBlog);
router.put('/blog/:id', authMiddleware, updateBlog);
router.delete('/blog/:id', authMiddleware, deleteBlog);

// --- Farm Routes ---
router.post('/farm', authMiddleware, createFarm);
router.get('/farm', getFarm);
router.put('/farm/:id', authMiddleware, updateFarm);
router.delete('/farm/:id', authMiddleware, deleteFarm);

// --- Magazine Routes ---
router.post('/magazine', authMiddleware, createMagazine);
router.get('/magazine', getMagazine);
router.put('/magazine/:id', authMiddleware, updateMagazine);
router.delete('/magazine/:id', authMiddleware, deleteMagazine);

module.exports = router;
