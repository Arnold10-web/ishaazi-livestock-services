import express from 'express';
import upload, { optimizeImage } from '../middleware/fileUpload.js';
import { authenticateToken, requireRole } from '../middleware/enhancedAuthMiddleware.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { validate, blogSchemas, newsSchemas, validateObjectId, validateFileUpload } from '../middleware/validation.js';
import { sensitiveOperationLimiter } from '../middleware/sanitization.js';
import processFormData from '../middleware/formDataCompatibility.js';
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

// Blog Routes with validation and enhanced form data compatibility
router.post('/blogs',
  authenticateToken, requireRole(['system_admin', 'editor']),
  // sensitiveOperationLimiter, // Temporarily disabled for testing
  upload.single('image'),
  validateFileUpload,
  optimizeImage,
  processFormData, // Process FormData fields for POST as well
  validate(blogSchemas.create),
  invalidateCache(['blogs']),
  createBlog
);
router.get('/blogs', cacheMiddleware(300), getBlogs);
router.get('/blogs/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminBlogs);
router.get('/blogs/:id', validateObjectId('id'), cacheMiddleware(600), getBlogById);
router.put('/blogs/:id',
  authenticateToken, requireRole(['system_admin', 'editor']),
  validateObjectId('id'),
  upload.single('image'),
  validateFileUpload,
  optimizeImage,
  processFormData, // Process FormData fields before validation
  validate(blogSchemas.update), // Re-add validation after processing
  invalidateCache(['blogs']),
  updateBlog
);
router.delete('/blogs/:id',
  authenticateToken, requireRole(['system_admin', 'editor']),
  // sensitiveOperationLimiter, // Temporarily disabled for testing
  validateObjectId('id'),
  invalidateCache(['blogs']),
  deleteBlog
);

// News Routes with validation and enhanced form data compatibility
router.post('/news',
  authenticateToken, requireRole(['system_admin', 'editor']),
  // sensitiveOperationLimiter, // Temporarily disabled for testing
  upload.single('image'),
  validateFileUpload,
  optimizeImage,
  processFormData, // Process FormData fields for POST as well
  validate(newsSchemas.create),
  invalidateCache(['news']),
  createNews
);
router.get('/news', cacheMiddleware(300), getNews);
router.get('/news/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminNews);
router.get('/news/:id', cacheMiddleware(600), getNewsById);
router.put('/news/:id', 
  authenticateToken, requireRole(['system_admin', 'editor']), 
  upload.single('image'), 
  optimizeImage, 
  processFormData, // Add form data processing
  validate(newsSchemas.update), // Add validation
  invalidateCache(['news']), 
  updateNews
);
router.delete('/news/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['news']), deleteNews);


// Basic Routes

// Create a new Basic media (video/audio)
router.post(
  '/basics',
  authenticateToken, requireRole(['system_admin', 'editor']),
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
router.get('/basics/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminBasics);

// Get a single Basic media by ID
router.get('/basics/:id', cacheMiddleware(600), getBasicById);

// Update a Basic media by ID
router.put(
  '/basics/:id',
  authenticateToken, requireRole(['system_admin', 'editor']),
  upload.fields([
    { name: 'image', maxCount: 1 }, // Optional updated thumbnail image
    { name: 'media', maxCount: 1 }, // Optional updated media file (video/audio)
  ]),
  optimizeImage,
  invalidateCache(['basics']),
  updateBasic
);

// Delete a Basic media by ID
router.delete('/basics/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['basics']), deleteBasic);

// Add a comment to a Basic media
router.post('/basics/:id/comments', invalidateCache(['basics']), addComment);

// Delete a comment from a Basic media
router.delete('/basics/:id/comments/:commentId', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['basics']), deleteComment);
// Farms Routes
router.post('/farms', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['farms']), createFarm);
router.get('/farms', cacheMiddleware(300), getFarms);
router.get('/farms/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminFarms);
router.get('/farms/:id', cacheMiddleware(600), getFarmById);
router.put('/farms/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), optimizeImage, invalidateCache(['farms']), updateFarm);
router.delete('/farms/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['farms']), deleteFarm);

// Magazine Routes
router.post('/magazines', authenticateToken, requireRole(['system_admin', 'editor']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), optimizeImage, invalidateCache(['magazines']), createMagazine);
router.get('/magazines', cacheMiddleware(300), getMagazines);
router.get('/magazines/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminMagazines);
router.get('/magazines/:id', cacheMiddleware(600), getMagazineById);
router.put('/magazines/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), optimizeImage, invalidateCache(['magazines']), updateMagazine);
router.delete('/magazines/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['magazines']), deleteMagazine);

// Piggery Routes
router.post('/piggeries', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['piggeries']), createPiggery);
router.get('/piggeries', cacheMiddleware(300), getPiggeries);
router.get('/piggeries/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminPiggeries);
router.get('/piggeries/:id', cacheMiddleware(600), getPiggeryById);
router.put('/piggeries/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), optimizeImage, invalidateCache(['piggeries']), updatePiggery);
router.delete('/piggeries/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['piggeries']), deletePiggery);

// Dairy Routes
router.post('/dairies', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['dairies']), createDairy);
router.get('/dairies', cacheMiddleware(300), getDairies);
router.get('/dairies/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminDairies);
router.get('/dairies/:id', cacheMiddleware(600), getDairyById);
router.put('/dairies/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), optimizeImage, invalidateCache(['dairies']), updateDairy);
router.delete('/dairies/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['dairies']), deleteDairy);

// Beef Routes
router.post('/beefs', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['beefs']), createBeef);
router.get('/beefs', cacheMiddleware(300), getBeefs);
router.get('/beefs/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminBeefs);
router.get('/beefs/:id', cacheMiddleware(600), getBeefById);
router.put('/beefs/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), optimizeImage, invalidateCache(['beefs']), updateBeef);
router.delete('/beefs/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['beefs']), deleteBeef);

// Goat Routes
router.post('/goats', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['goats']), createGoat);
router.get('/goats', cacheMiddleware(300), getGoats);
router.get('/goats/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminGoats);
router.get('/goats/:id', cacheMiddleware(600), getGoatById);
router.put('/goats/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), optimizeImage, invalidateCache(['goats']), updateGoat);
router.delete('/goats/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['goats']), deleteGoat);


// Subscriber Routes
router.get('/subscribers', authenticateToken, requireRole(['system_admin', 'editor']), getSubscribers);
router.post('/subscribers', createSubscriber);
router.delete('/subscribers/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteSubscriber);
router.put('/subscribers/bulk', authenticateToken, requireRole(['system_admin', 'editor']), bulkUpdateSubscribers);

// Newsletter Routes
router.get('/newsletters', getNewsletters);
router.post('/newsletters', authenticateToken, requireRole(['system_admin', 'editor']), createNewsletter);
router.put('/newsletters/:id', authenticateToken, requireRole(['system_admin', 'editor']), updateNewsletter);
router.delete('/newsletters/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteNewsletter);
router.post('/newsletters/:id/send', authenticateToken, requireRole(['system_admin', 'editor']), sendNewsletter);

// Event Routes
router.post('/events', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), validateFileUpload, optimizeImage, invalidateCache(['events']), createEvent);
router.get('/events', getEvents);
router.get('/events/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), updateEvent);
router.delete('/events/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteEvent);

// Event Registration Routes (Public)
router.post('/events/:eventId/register', registerForEvent);
router.get('/events/:eventId/registrations', authenticateToken, requireRole(['system_admin', 'editor']), getEventRegistrations);
router.get('/events/:eventId/registration', getRegistrationByEmail);
router.post('/events/:eventId/cancel', cancelEventRegistration);
router.get('/events/:eventId/stats', authenticateToken, requireRole(['system_admin', 'editor']), getEventRegistrationStats);

// Auction Routes
router.post('/auctions', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), createAuction);
router.get('/auctions', getAuctions);
router.get('/auctions/upcoming', getUpcomingAuctions);
router.get('/auctions/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminAuctions);
router.get('/auctions/:id', getAuctionById);
router.put('/auctions/:id', authenticateToken, requireRole(['system_admin', 'editor']), upload.single('image'), updateAuction);
router.delete('/auctions/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteAuction);
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
router.delete('/:contentType/:id/comments/:commentId', authenticateToken, requireRole(['system_admin', 'editor']), deleteContentComment);

// Approve comment for any content type (admin only)
router.patch('/:contentType/:id/comments/:commentId/approve', authenticateToken, requireRole(['system_admin', 'editor']), approveContentComment);

export default router;
