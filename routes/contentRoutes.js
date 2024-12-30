import express from 'express';
import upload from '../middleware/fileUpload.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createBlog,
  getBlogs,
  getBlogById,
  getAdminBlogs,
  updateBlog,
  deleteBlog,
  createNews,
  getNews,
  getAdminNews,
  getNewsById,
  updateNews,
  deleteNews,
  createBasic,
  getBasics,
  getBasicById,
  getAdminBasics,
  updateBasic,
  deleteBasic,
  addComment,
  deleteComment,
  createFarm,
  getFarms,
  getFarmById,
  getAdminFarms,
  updateFarm,
  deleteFarm,
  createMagazine,
  getMagazines,
  getMagazineById,
  getAdminMagazines,
  updateMagazine,
  deleteMagazine,
  createPiggery,
  getPiggeries,
  getPiggeryById,
  getAdminPiggeries,
  updatePiggery,
  deletePiggery,
  createDairy,
  getDairies,
  getDairyById,
  getAdminDairies,
  updateDairy,
  deleteDairy,
  createBeef,
  getBeefs,
  getBeefById,
  getAdminBeefs,
  updateBeef,
  deleteBeef,
  createGoat,
  getGoats,
  getGoatById,
  getAdminGoats,
  updateGoat,
  deleteGoat, 
  createSubscriber,
  getSubscribers,
  deleteSubscriber,
  createNewsletter,
  getNewsletters,
  updateNewsletter,
  deleteNewsletter,
  sendNewsletter,

 
} from '../controllers/contentController.js';

const router = express.Router();

// File upload routes
router.post('/upload/images', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ message: 'Image uploaded', path: req.file.path });
});

router.post('/upload/media', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ message: 'Media uploaded', path: req.file.path });
});

// Blog Routes
router.post('/blogs', authMiddleware, upload.single('image'), createBlog);
router.get('/blogs', getBlogs);
router.get('/blogs/admin', authMiddleware, getAdminBlogs);
router.get('/blogs/:id', getBlogById);
router.put('/blogs/:id', authMiddleware, upload.single('image'), updateBlog);
router.delete('/blogs/:id', authMiddleware, deleteBlog);

// News Routes
router.post('/news', authMiddleware, upload.single('image'), createNews);
router.get('/news', getNews);
router.get('/news/admin', authMiddleware, getAdminNews);
router.get('/news/:id', getNewsById);
router.put('/news/:id', authMiddleware, upload.single('image'), updateNews);
router.delete('/news/:id', authMiddleware, deleteNews);


// Basic Routes

// Create a new Basic media (video/audio)
router.post(
  '/basics',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 }, // Optional thumbnail image
    { name: 'media', maxCount: 1 }, // Required media file (video/audio)
  ]),
  createBasic
);

// Get all Basics (public view, supports pagination)
router.get('/basics', getBasics);

// Get all Basics for admin (admin view, supports pagination)
router.get('/basics/admin', authMiddleware, getAdminBasics);

// Get a single Basic media by ID
router.get('/basics/:id', getBasicById);

// Update a Basic media by ID
router.put(
  '/basics/:id',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 }, // Optional updated thumbnail image
    { name: 'media', maxCount: 1 }, // Optional updated media file (video/audio)
  ]),
  updateBasic
);

// Delete a Basic media by ID
router.delete('/basics/:id', authMiddleware, deleteBasic);

// Add a comment to a Basic media
router.post('/basics/:id/comments', addComment);

// Delete a comment from a Basic media
router.delete('/basics/:id/comments/:commentId', authMiddleware, deleteComment);
// Farms Routes
router.post('/farms', authMiddleware, upload.single('image'), createFarm);
router.get('/farms', getFarms);
router.get('/farms/admin', authMiddleware, getAdminFarms);
router.get('/farms/:id', getFarmById);
router.put('/farms/:id', authMiddleware, upload.single('image'), updateFarm);
router.delete('/farms/:id', authMiddleware, deleteFarm);

// Magazine Routes
router.post('/magazines', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), createMagazine);
router.get('/magazines', getMagazines);
router.get('/magazines/admin', authMiddleware, getAdminMagazines);
router.get('/magazines/:id', getMagazineById);
router.put('/magazines/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), updateMagazine);
router.delete('/magazines/:id', authMiddleware, deleteMagazine);

// Piggery Routes
router.post('/piggeries', authMiddleware, upload.single('image'), createPiggery);
router.get('/piggeries', getPiggeries);
router.get('/piggeries/admin', authMiddleware, getAdminPiggeries);
router.get('/piggeries/:id', getPiggeryById);
router.put('/piggeries/:id', authMiddleware, upload.single('image'), updatePiggery);
router.delete('/piggeries/:id', authMiddleware, deletePiggery);

// Dairy Routes
router.post('/dairies', authMiddleware, upload.single('image'), createDairy);
router.get('/dairies', getDairies);
router.get('/dairies/admin', authMiddleware, getAdminDairies);
router.get('/dairies/:id', getDairyById);
router.put('/dairies/:id', authMiddleware, upload.single('image'), updateDairy);
router.delete('/dairies/:id', authMiddleware, deleteDairy);

// Beef Routes
router.post('/beefs', authMiddleware, upload.single('image'), createBeef);
router.get('/beefs', getBeefs);
router.get('/beefs/admin', authMiddleware, getAdminBeefs);
router.get('/beefs/:id', getBeefById);
router.put('/beefs/:id', authMiddleware, upload.single('image'), updateBeef);
router.delete('/beefs/:id', authMiddleware, deleteBeef);

// Goat Routes
router.post('/goats', authMiddleware, upload.single('image'), createGoat);
router.get('/goats', getGoats);
router.get('/goats/admin', authMiddleware, getAdminGoats);
router.get('/goats/:id', getGoatById);
router.put('/goats/:id', authMiddleware, upload.single('image'), updateGoat);
router.delete('/goats/:id', authMiddleware, deleteGoat);


// Subscriber Routes
router.get('/subscribers', authMiddleware, getSubscribers);
router.post('/subscribers', createSubscriber);
router.delete('/subscribers/:id', authMiddleware, deleteSubscriber);

// Newsletter Routes
router.get('/newsletters', authMiddleware, getNewsletters);
router.post('/newsletters', authMiddleware, createNewsletter);
router.put('/newsletters/:id', authMiddleware, updateNewsletter);
router.delete('/newsletters/:id', authMiddleware, deleteNewsletter);
router.post('/newsletters/:id/send', authMiddleware, sendNewsletter);



export default router;
