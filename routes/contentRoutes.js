import express from 'express';
import upload, { optimizeImage } from '../middleware/fileUpload.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { validate, blogSchemas, newsSchemas, validateObjectId, validateFileUpload } from '../middleware/validation.js';
import { sensitiveOperationLimiter } from '../middleware/sanitization.js';
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
  bulkUpdateSubscribers,
  createNewsletter,
  getNewsletters,
  updateNewsletter,
  deleteNewsletter,
  sendNewsletter,
  createEvent,
  getEvents,
  getEventById,
  getAdminEvents,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  getRegistrationByEmail,
  cancelEventRegistration,
  getEventRegistrationStats,
  createAuction,
  getAuctions,
  getAuctionById,
  getAdminAuctions,
  updateAuction,
  deleteAuction,
  registerInterest,
  getUpcomingAuctions,
  // Engagement tracking functions
  trackView,
  trackLike,
  trackShare,
  getEngagementStats,
  addContentComment,
  deleteContentComment,
  approveContentComment
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

// Blog Routes with validation
router.post('/blogs',
  authMiddleware,
  sensitiveOperationLimiter,
  upload.single('image'),
  validateFileUpload,
  optimizeImage,
  validate(blogSchemas.create),
  invalidateCache(['blogs']),
  createBlog
);
router.get('/blogs', cacheMiddleware(300), getBlogs);
router.get('/blogs/admin', authMiddleware, getAdminBlogs);
router.get('/blogs/:id', validateObjectId('id'), cacheMiddleware(600), getBlogById);
router.put('/blogs/:id',
  authMiddleware,
  validateObjectId('id'),
  upload.single('image'),
  validateFileUpload,
  optimizeImage,
  validate(blogSchemas.update),
  invalidateCache(['blogs']),
  updateBlog
);
router.delete('/blogs/:id',
  authMiddleware,
  sensitiveOperationLimiter,
  validateObjectId('id'),
  invalidateCache(['blogs']),
  deleteBlog
);

// News Routes
router.post('/news', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['news']), createNews);
router.get('/news', cacheMiddleware(300), getNews);
router.get('/news/admin', authMiddleware, getAdminNews);
router.get('/news/:id', cacheMiddleware(600), getNewsById);
router.put('/news/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['news']), updateNews);
router.delete('/news/:id', authMiddleware, invalidateCache(['news']), deleteNews);


// Basic Routes

// Create a new Basic media (video/audio)
router.post(
  '/basics',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 }, // Optional thumbnail image
    { name: 'media', maxCount: 1 }, // Required media file (video/audio)
  ]),
  optimizeImage,
  invalidateCache(['basics']),
  createBasic
);

// Get all Basics (public view, supports pagination)
router.get('/basics', cacheMiddleware(300), getBasics);

// Get all Basics for admin (admin view, supports pagination)
router.get('/basics/admin', authMiddleware, getAdminBasics);

// Get a single Basic media by ID
router.get('/basics/:id', cacheMiddleware(600), getBasicById);

// Update a Basic media by ID
router.put(
  '/basics/:id',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 }, // Optional updated thumbnail image
    { name: 'media', maxCount: 1 }, // Optional updated media file (video/audio)
  ]),
  optimizeImage,
  invalidateCache(['basics']),
  updateBasic
);

// Delete a Basic media by ID
router.delete('/basics/:id', authMiddleware, invalidateCache(['basics']), deleteBasic);

// Add a comment to a Basic media
router.post('/basics/:id/comments', invalidateCache(['basics']), addComment);

// Delete a comment from a Basic media
router.delete('/basics/:id/comments/:commentId', authMiddleware, invalidateCache(['basics']), deleteComment);
// Farms Routes
router.post('/farms', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['farms']), createFarm);
router.get('/farms', cacheMiddleware(300), getFarms);
router.get('/farms/admin', authMiddleware, getAdminFarms);
router.get('/farms/:id', cacheMiddleware(600), getFarmById);
router.put('/farms/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['farms']), updateFarm);
router.delete('/farms/:id', authMiddleware, invalidateCache(['farms']), deleteFarm);

// Magazine Routes
router.post('/magazines', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), optimizeImage, invalidateCache(['magazines']), createMagazine);
router.get('/magazines', cacheMiddleware(300), getMagazines);
router.get('/magazines/admin', authMiddleware, getAdminMagazines);
router.get('/magazines/:id', cacheMiddleware(600), getMagazineById);
router.put('/magazines/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), optimizeImage, invalidateCache(['magazines']), updateMagazine);
router.delete('/magazines/:id', authMiddleware, invalidateCache(['magazines']), deleteMagazine);

// Piggery Routes
router.post('/piggeries', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['piggeries']), createPiggery);
router.get('/piggeries', cacheMiddleware(300), getPiggeries);
router.get('/piggeries/admin', authMiddleware, getAdminPiggeries);
router.get('/piggeries/:id', cacheMiddleware(600), getPiggeryById);
router.put('/piggeries/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['piggeries']), updatePiggery);
router.delete('/piggeries/:id', authMiddleware, invalidateCache(['piggeries']), deletePiggery);

// Dairy Routes
router.post('/dairies', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['dairies']), createDairy);
router.get('/dairies', cacheMiddleware(300), getDairies);
router.get('/dairies/admin', authMiddleware, getAdminDairies);
router.get('/dairies/:id', cacheMiddleware(600), getDairyById);
router.put('/dairies/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['dairies']), updateDairy);
router.delete('/dairies/:id', authMiddleware, invalidateCache(['dairies']), deleteDairy);

// Beef Routes
router.post('/beefs', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['beefs']), createBeef);
router.get('/beefs', cacheMiddleware(300), getBeefs);
router.get('/beefs/admin', authMiddleware, getAdminBeefs);
router.get('/beefs/:id', cacheMiddleware(600), getBeefById);
router.put('/beefs/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['beefs']), updateBeef);
router.delete('/beefs/:id', authMiddleware, invalidateCache(['beefs']), deleteBeef);

// Goat Routes
router.post('/goats', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['goats']), createGoat);
router.get('/goats', cacheMiddleware(300), getGoats);
router.get('/goats/admin', authMiddleware, getAdminGoats);
router.get('/goats/:id', cacheMiddleware(600), getGoatById);
router.put('/goats/:id', authMiddleware, upload.single('image'), optimizeImage, invalidateCache(['goats']), updateGoat);
router.delete('/goats/:id', authMiddleware, invalidateCache(['goats']), deleteGoat);


// Subscriber Routes
router.get('/subscribers', authMiddleware, getSubscribers);
router.post('/subscribers', createSubscriber);
router.delete('/subscribers/:id', authMiddleware, deleteSubscriber);
router.put('/subscribers/bulk', authMiddleware, bulkUpdateSubscribers);

// Newsletter Routes
router.get('/newsletters', getNewsletters);
router.post('/newsletters', authMiddleware, createNewsletter);
router.put('/newsletters/:id', authMiddleware, updateNewsletter);
router.delete('/newsletters/:id', authMiddleware, deleteNewsletter);
router.post('/newsletters/:id/send', authMiddleware, sendNewsletter);

// Event Routes
router.post('/events', authMiddleware, upload.single('image'), createEvent);
router.get('/events', getEvents);
router.get('/events/admin', authMiddleware, getAdminEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', authMiddleware, upload.single('image'), updateEvent);
router.delete('/events/:id', authMiddleware, deleteEvent);

// Event Registration Routes (Public)
router.post('/events/:eventId/register', registerForEvent);
router.get('/events/:eventId/registrations', authMiddleware, getEventRegistrations);
router.get('/events/:eventId/registration', getRegistrationByEmail);
router.post('/events/:eventId/cancel', cancelEventRegistration);
router.get('/events/:eventId/stats', authMiddleware, getEventRegistrationStats);

// Auction Routes
router.post('/auctions', authMiddleware, upload.single('image'), createAuction);
router.get('/auctions', getAuctions);
router.get('/auctions/upcoming', getUpcomingAuctions);
router.get('/auctions/admin', authMiddleware, getAdminAuctions);
router.get('/auctions/:id', getAuctionById);
router.put('/auctions/:id', authMiddleware, upload.single('image'), updateAuction);
router.delete('/auctions/:id', authMiddleware, deleteAuction);
router.post('/auctions/:id/register', registerInterest);

// ENGAGEMENT TRACKING ROUTES
// View tracking - increment views when content is accessed
router.post('/:contentType/:id/view', trackView);

// Like tracking - toggle likes on content
router.post('/:contentType/:id/like', trackLike);

// Share tracking - increment shares when content is shared
router.post('/:contentType/:id/share', trackShare);

// Get engagement stats for any content
router.get('/:contentType/:id/stats', getEngagementStats);

// COMMENT MANAGEMENT ROUTES
// Add comment to any content type
router.post('/:contentType/:id/comments', addContentComment);

// Delete comment from any content type (admin only)
router.delete('/:contentType/:id/comments/:commentId', authMiddleware, deleteContentComment);

// Approve comment for any content type (admin only)
router.patch('/:contentType/:id/comments/:commentId/approve', authMiddleware, approveContentComment);

export default router;
