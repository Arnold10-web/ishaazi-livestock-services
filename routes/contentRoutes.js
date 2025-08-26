import express from 'express';
import { storeInGridFS } from '../middleware/enhancedFileUpload.js';
import { authenticateToken, requireRole } from '../middleware/enhancedAuthMiddleware.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { cacheProfiles } from '../middleware/enhancedCache.js';
import { forceContentRefresh } from '../utils/unifiedPerformance.js';
import { completeAdminRefresh } from '../middleware/forceRefresh.js';
import { validate, blogSchemas, newsSchemas, magazineSchemas, validateObjectId, validateFileUpload } from '../middleware/validation.js';
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
  confirmSubscription,
  unsubscribeHandler,
  updateEmailPreferences,
  createNewsletter,
  getNewsletters,
  getAdminNewsletters,
  updateNewsletter,
  deleteNewsletter,
  sendNewsletter,
  createEvent,
  getEvents,
  getEventById,
  getAdminEvents,
  updateEvent,
  deleteEvent,
  // Event Registration functions
  registerForEvent,
  getAdminRegistrations,
  getAllEventRegistrations,
  updateEventRegistration,
  deleteEventRegistration,
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
  verifyReadingTimeAccuracy,
  verifyStatisticsAccuracy,

} from '../controllers/contentController.js';

const router = express.Router();

// File upload routes
router.post('/upload/images', ...storeInGridFS('file', ['image/*']), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ message: 'Image uploaded', fileId: req.file.id });
});

router.post('/upload/media', ...storeInGridFS('file', ['video/*', 'audio/*']), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ message: 'Media uploaded', fileId: req.file.id });
});

// Debug middleware to log file upload info
const debugFileUpload = (req, res, next) => {
  console.log('🔍 DEBUG MIDDLEWARE: File upload debug');
  console.log('🔍 DEBUG MIDDLEWARE: req.file:', req.file);
  console.log('🔍 DEBUG MIDDLEWARE: req.files:', req.files);
  console.log('🔍 DEBUG MIDDLEWARE: req.body keys:', Object.keys(req.body || {}));
  next();
};

// Blog Routes with validation and enhanced form data compatibility
router.post('/blogs',
  authenticateToken, requireRole(['system_admin', 'editor']),
  sensitiveOperationLimiter,
  ...storeInGridFS('image', ['image/*'], { optional: true }),
  debugFileUpload, // Add debug middleware
  validateFileUpload,
  processFormData, // Process FormData fields for POST as well
  validate(blogSchemas.create),
  ...completeAdminRefresh(['blogs']),
  createBlog
);
router.get('/blogs', getBlogs); // Temporarily disable cache to fix stale data
router.get('/blogs/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminBlogs);
router.get('/blogs/:id', validateObjectId('id'), cacheMiddleware(600), getBlogById);
router.put('/blogs/:id',
  authenticateToken, requireRole(['system_admin', 'editor']),
  validateObjectId('id'),
  ...storeInGridFS('image', ['image/*'], { optional: true }),
  validateFileUpload,
  processFormData, // Process FormData fields before validation
  validate(blogSchemas.update), // Re-add validation after processing
  invalidateCache(['blogs']),
  updateBlog
);
router.delete('/blogs/:id',
  authenticateToken, requireRole(['system_admin', 'editor']),
  sensitiveOperationLimiter,
  validateObjectId('id'),
  forceContentRefresh(['blogs']),
  invalidateCache(['blogs']),
  deleteBlog
);

// News Routes with validation and enhanced form data compatibility
router.post('/news',
  authenticateToken, requireRole(['system_admin', 'editor']),
  sensitiveOperationLimiter,
  ...storeInGridFS('image', ['image/*'], { optional: true }),
  validateFileUpload,
  processFormData, // Process FormData fields for POST as well
  validate(newsSchemas.create),
  ...completeAdminRefresh(['news']),
  createNews
);
router.get('/news', cacheProfiles.news, getNews);
router.get('/news/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminNews);
router.get('/news/:id', cacheProfiles.news, getNewsById);
router.put('/news/:id', 
  authenticateToken, requireRole(['system_admin', 'editor']), 
  ...storeInGridFS('image', ['image/*'], { optional: true }), 
  processFormData, // Add form data processing
  validate(newsSchemas.update), // Add validation
  invalidateCache(['news']), 
  updateNews
);
router.delete('/news/:id', authenticateToken, requireRole(['system_admin', 'editor']), forceContentRefresh(['news']), invalidateCache(['news']), deleteNews);


// Basic Routes

// Create a new Basic media (video/audio)
router.post(
  '/basics',
  authenticateToken, requireRole(['system_admin', 'editor']),
  ...storeInGridFS('image', ['image/*'], { optional: true }),
  ...storeInGridFS('media', ['video/*', 'audio/*']),
  validateFileUpload,
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
  ...storeInGridFS('image', ['image/*'], { optional: true }),
  ...storeInGridFS('media', ['video/*', 'audio/*'], { optional: true }),
  validateFileUpload,
  invalidateCache(['basics']),
  updateBasic
);

// Delete a Basic media by ID
router.delete('/basics/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['basics']), deleteBasic);
// Farms Routes
router.post('/farms', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), validateFileUpload, ...completeAdminRefresh(['farms']), createFarm);
router.get('/farms', cacheMiddleware(300), getFarms);
router.get('/farms/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminFarms);
router.get('/farms/:id', cacheMiddleware(600), getFarmById);
router.put('/farms/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), invalidateCache(['farms']), updateFarm);
router.delete('/farms/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['farms']), deleteFarm);

// Magazine Routes
// Magazine Routes with validation and enhanced form data compatibility
router.post('/magazines', 
  authenticateToken, requireRole(['system_admin', 'editor']),
  (req, res, next) => {
    console.log('📝 Magazine creation request received');
    console.log('📝 Headers:', req.headers['content-type']);
    next();
  },
  ...storeInGridFS('image', ['image/*']), 
  ...storeInGridFS('pdf', ['application/pdf']),
  (req, res, next) => {
    console.log('📝 After file upload middleware');
    console.log('📝 Files received:', req.files ? Object.keys(req.files) : 'none');
    console.log('📝 Body fields:', Object.keys(req.body));
    next();
  }, 
  validateFileUpload,
  (req, res, next) => {
    console.log('📝 After file validation');
    next();
  },
  processFormData, // Add form data processing
  (req, res, next) => {
    console.log('📝 After form data processing');
    console.log('📝 Processed body:', Object.keys(req.body));
    if (req.body.tags) console.log('📝 Tags type:', typeof req.body.tags);
    if (req.body.metadata) console.log('📝 Metadata type:', typeof req.body.metadata);
    next();
  },
  validate(magazineSchemas.create), // Add magazine validation
  (req, res, next) => {
    console.log('📝 After schema validation');
    next();
  },
  ...completeAdminRefresh(['magazines']),
  (req, res, next) => {
    console.log('📝 After cache invalidation');
    next();
  }, 
  createMagazine
);
router.get('/magazines', cacheMiddleware(300), getMagazines);
router.get('/magazines/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminMagazines);
router.get('/magazines/:id', cacheMiddleware(600), getMagazineById);
router.put('/magazines/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), ...storeInGridFS('pdf', ['application/pdf'], { optional: true }), invalidateCache(['magazines']), updateMagazine);
router.delete('/magazines/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['magazines']), deleteMagazine);

// Piggery Routes
router.post('/piggeries', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), validateFileUpload, ...completeAdminRefresh(['piggeries']), createPiggery);
router.get('/piggeries', cacheMiddleware(300), getPiggeries);
router.get('/piggeries/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminPiggeries);
router.get('/piggeries/:id', cacheMiddleware(600), getPiggeryById);
router.put('/piggeries/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), invalidateCache(['piggeries']), updatePiggery);
router.delete('/piggeries/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['piggeries']), deletePiggery);

// Dairy Routes
router.post('/dairies', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), validateFileUpload, ...completeAdminRefresh(['dairies']), createDairy);
router.get('/dairies', cacheMiddleware(300), getDairies);
router.get('/dairies/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminDairies);
router.get('/dairies/:id', cacheMiddleware(600), getDairyById);
router.put('/dairies/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), invalidateCache(['dairies']), updateDairy);
router.delete('/dairies/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['dairies']), deleteDairy);

// Beef Routes
router.post('/beefs', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), validateFileUpload, ...completeAdminRefresh(['beefs']), createBeef);
router.get('/beefs', cacheMiddleware(300), getBeefs);
router.get('/beefs/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminBeefs);
router.get('/beefs/:id', cacheMiddleware(600), getBeefById);
router.put('/beefs/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), invalidateCache(['beefs']), updateBeef);
router.delete('/beefs/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['beefs']), deleteBeef);

// Goat Routes
router.post('/goats', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), validateFileUpload, ...completeAdminRefresh(['goats']), createGoat);
router.get('/goats', cacheMiddleware(300), getGoats);
router.get('/goats/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminGoats);
router.get('/goats/:id', cacheMiddleware(600), getGoatById);
router.put('/goats/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), invalidateCache(['goats']), updateGoat);
router.delete('/goats/:id', authenticateToken, requireRole(['system_admin', 'editor']), invalidateCache(['goats']), deleteGoat);


// Subscriber Routes
router.get('/subscribers', authenticateToken, requireRole(['system_admin', 'editor']), getSubscribers);
router.post('/subscribers', createSubscriber);
router.delete('/subscribers/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteSubscriber);
router.put('/subscribers/bulk', authenticateToken, requireRole(['system_admin', 'editor']), bulkUpdateSubscribers);

// Email Automation Routes
router.get('/confirm-subscription', confirmSubscription);
router.post('/unsubscribe', unsubscribeHandler);
router.put('/email-preferences', updateEmailPreferences);

// Newsletter Routes
router.get('/newsletters', getNewsletters);
router.get('/newsletters/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminNewsletters);
router.post('/newsletters', authenticateToken, requireRole(['system_admin', 'editor']), createNewsletter);
router.put('/newsletters/:id', authenticateToken, requireRole(['system_admin', 'editor']), updateNewsletter);
router.delete('/newsletters/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteNewsletter);
router.post('/newsletters/:id/send', authenticateToken, requireRole(['system_admin', 'editor']), sendNewsletter);

// Event Routes
router.post('/events', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*']), validateFileUpload, ...completeAdminRefresh(['events']), createEvent);
router.get('/events', getEvents);
router.get('/events/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), updateEvent);
router.delete('/events/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteEvent);

// Public Event Registration Route (no authentication required)
router.post('/events/:eventId/register', registerForEvent);

// Event Registration Routes
router.get('/event-registrations/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminRegistrations);
router.get('/event-registrations', authenticateToken, requireRole(['system_admin', 'editor']), getAllEventRegistrations);
router.put('/event-registrations/:id', authenticateToken, requireRole(['system_admin', 'editor']), updateEventRegistration);
router.delete('/event-registrations/:id', authenticateToken, requireRole(['system_admin', 'editor']), deleteEventRegistration);

// Auction Routes
router.post('/auctions', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*']), validateFileUpload, createAuction);
router.get('/auctions', getAuctions);
router.get('/auctions/upcoming', getUpcomingAuctions);
router.get('/auctions/admin', authenticateToken, requireRole(['system_admin', 'editor']), getAdminAuctions);
router.get('/auctions/:id', getAuctionById);
router.put('/auctions/:id', authenticateToken, requireRole(['system_admin', 'editor']), ...storeInGridFS('image', ['image/*'], { optional: true }), updateAuction);
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

// ACCURACY VERIFICATION ROUTES
// Verify reading time accuracy across all content types
router.get('/verify/reading-time', verifyReadingTimeAccuracy);

// Verify statistics accuracy across dashboard metrics
router.get('/verify/statistics', verifyStatisticsAccuracy);

// PERFORMANCE ROUTES
// Manual content cache refresh endpoint
router.post('/refresh-cache', authenticateToken, requireRole(['system_admin', 'editor']), async (req, res) => {
  try {
    const { refreshContent } = await import('../utils/unifiedPerformance.js');
    await refreshContent(req, res);
  } catch (error) {
    console.error('Cache refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing cache'
    });
  }
});

// Manual cache refresh endpoint for immediate content updates
router.post('/refresh-cache', authenticateToken, requireRole(['system_admin', 'editor']), async (req, res) => {
  try {
    // Clear all content-related caches
    if (global.memoryCache) {
      global.memoryCache.flushAll();
    }
    
    const { invalidateCache } = await import('../middleware/enhancedCache.js');
    await invalidateCache(['blogs', 'news', 'events', 'content', 'dashboard', 'search']);
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh cache',
      error: error.message
    });
  }
});

export default router;
