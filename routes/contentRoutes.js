//routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/images/' });
const mediaUpload = multer({ dest: 'uploads/media/' });

// Blog Routes
router.post('/blogs', authMiddleware, upload.single('image'), contentController.createBlog); // Admin: Create Blog
router.get('/blogs', contentController.getBlogs); // Combined Public and Admin
router.put('/blogs/:id', authMiddleware, upload.single('image'), contentController.updateBlog); // Admin: Update Blog
router.delete('/blogs/:id', authMiddleware, contentController.deleteBlog); // Admin: Delete Blog

// News Routes
router.post('/news', authMiddleware, upload.single('image'), contentController.createNews); // Admin: Create News
router.get('/news', contentController.getNews); // Public: List News
router.put('/news/:id', authMiddleware, upload.single('image'), contentController.updateNews); // Admin: Update News
router.delete('/news/:id', authMiddleware, contentController.deleteNews); // Admin: Delete News

// Farm Basics Routes
router.post('/farm-basics', authMiddleware, mediaUpload.single('file'), contentController.uploadFarmBasics); // Admin: Upload Media
router.get('/farm-basics', contentController.getFarmBasics); // Public: List Media
router.put('/farm-basics/:id', authMiddleware, contentController.updateFarmBasics); // Admin: Update Media
router.delete('/farm-basics/:id', authMiddleware, contentController.deleteFarmBasics); // Admin: Delete Media

// FarmsForSale Routes
router.post('/farms-for-sale', authMiddleware, upload.single('image'), contentController.createFarmForSale); // Admin: Create Farms
router.get('/farms-for-sale', contentController.getFarmsForSale); // Public: List Farms
router.put('/farms-for-sale/:id', authMiddleware, upload.single('image'), contentController.updateFarmForSale); // Admin: Update Farms
router.delete('/farms-for-sale/:id', authMiddleware, contentController.deleteFarmForSale); // Admin: Delete Farms

// Magazine Routes
router.post('/magazines', authMiddleware, upload.single('image'), contentController.createMagazine); // Admin: Create Magazine
router.get('/magazines', contentController.getMagazines); // Public: List Magazines
router.put('/magazines/:id', authMiddleware, upload.single('image'), contentController.updateMagazine); // Admin: Update Magazine
router.delete('/magazines/:id', authMiddleware, contentController.deleteMagazine); // Admin: Delete Magazine

module.exports = router;
