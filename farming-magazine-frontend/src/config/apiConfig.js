// src/config/apiConfig.js

// Base URL for your backend API (local or production URL)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
if (!BASE_URL) {
  console.error('BASE_URL is missing. Check your environment variables.');
}
console.log('API Base URL:', BASE_URL);

const API_ENDPOINTS = {
  // Export BASE_URL for direct use
  BASE_URL: BASE_URL,
  
  // Enhanced Admin Authentication
  ADMIN_REGISTER: `${BASE_URL}/api/admin/register`,
  ADMIN_LOGIN: `${BASE_URL}/api/admin/login`,
  ADMIN_LOGOUT: `${BASE_URL}/api/admin/logout`,
  
  // Dashboard Endpoints
  DASHBOARD_STATS: `${BASE_URL}/api/admin/dashboard`,
  EDITOR_DASHBOARD: `${BASE_URL}/api/admin/dashboard`,
  SYSTEM_ADMIN_DASHBOARD: `${BASE_URL}/api/admin/dashboard/security`,
  
  // Role-specific Dashboard Endpoints
  SECURITY_DASHBOARD: `${BASE_URL}/api/admin/dashboard/security`,
  PERFORMANCE_DASHBOARD: `${BASE_URL}/api/admin/dashboard/performance`,
  ANALYTICS_DASHBOARD: `${BASE_URL}/api/admin/dashboard/analytics`,
  SYSTEM_HEALTH_DASHBOARD: `${BASE_URL}/api/admin/dashboard/system-health`,
  
  // Additional System Admin Dashboard Endpoints
  DASHBOARD_SECURITY: `${BASE_URL}/api/admin/dashboard/security`,
  DASHBOARD_PERFORMANCE: `${BASE_URL}/api/admin/dashboard/performance`,
  DASHBOARD_ANALYTICS: `${BASE_URL}/api/admin/dashboard/analytics`,
  DASHBOARD_SYSTEM_HEALTH: `${BASE_URL}/api/admin/dashboard/system-health`,
  DASHBOARD_USERS_STATS: `${BASE_URL}/api/admin/users/stats`,
  DASHBOARD_ACTIVITY_LOGS: `${BASE_URL}/api/admin/activity-logs`,
  
  // User Management (System Admin only)
  GET_USERS: `${BASE_URL}/api/admin/users`,
  CREATE_USER: `${BASE_URL}/api/admin/users`,
  UPDATE_USER: (id) => `${BASE_URL}/api/admin/users/${id}`,
  DELETE_USER: (id) => `${BASE_URL}/api/admin/users/${id}`,
  
  // Activity Logs (System Admin only)
  GET_ACTIVITY_LOGS: `${BASE_URL}/api/admin/logs/activity`,
  EXPORT_ACTIVITY_LOGS: `${BASE_URL}/api/admin/logs/activity/export`,

  // Blog Management
  CREATE_BLOG: `${BASE_URL}/api/content/blogs`,
  GET_BLOGS: `${BASE_URL}/api/content/blogs`,
  GET_ADMIN_BLOGS: `${BASE_URL}/api/content/blogs/admin`,
  UPDATE_BLOG: (id) => `${BASE_URL}/api/content/blogs/${id}`,
  DELETE_BLOG: (id) => `${BASE_URL}/api/content/blogs/${id}`,

  // News Management
  CREATE_NEWS: `${BASE_URL}/api/content/news`,
  GET_NEWS: `${BASE_URL}/api/content/news`,
  GET_ADMIN_NEWS: `${BASE_URL}/api/content/news/admin`,
  UPDATE_NEWS: (id) => `${BASE_URL}/api/content/news/${id}`,
  DELETE_NEWS: (id) => `${BASE_URL}/api/content/news/${id}`,

  // Magazine Management
  CREATE_MAGAZINE: `${BASE_URL}/api/content/magazines`,
  GET_MAGAZINES: `${BASE_URL}/api/content/magazines`,
  GET_ADMIN_MAGAZINES: `${BASE_URL}/api/content/magazines/admin`,
  UPDATE_MAGAZINE: (id) => `${BASE_URL}/api/content/magazines/${id}`,
  DELETE_MAGAZINE: (id) => `${BASE_URL}/api/content/magazines/${id}`,


  // Basic Management
  CREATE_BASIC: `${BASE_URL}/api/content/basics`,
  GET_BASICS: `${BASE_URL}/api/content/basics`,
  GET_ADMIN_BASICS: `${BASE_URL}/api/content/basics/admin`,
  UPDATE_BASIC: (id) => `${BASE_URL}/api/content/basics/${id}`,
  DELETE_BASIC: (id) => `${BASE_URL}/api/content/basics/${id}`,

  // Basic Comment Management
  ADD_BASIC_COMMENT: (basicId) => `${BASE_URL}/api/content/basics/${basicId}/comments`,
  DELETE_BASIC_COMMENT: (basicId, commentId) => `${BASE_URL}/api/content/basics/${basicId}/comments/${commentId}`,


  // Farms for Sale Management
  CREATE_FARM: `${BASE_URL}/api/content/farms`,
  GET_FARMS: `${BASE_URL}/api/content/farms`,
  GET_ADMIN_FARMS: `${BASE_URL}/api/content/farms/admin`,
  UPDATE_FARM: (id) => `${BASE_URL}/api/content/farms/${id}`,
  DELETE_FARM: (id) => `${BASE_URL}/api/content/farms/${id}`,
  
  // Goat Management
  CREATE_GOAT: `${BASE_URL}/api/content/goats`,
  GET_GOATS: `${BASE_URL}/api/content/goats`,
  GET_ADMIN_GOATS: `${BASE_URL}/api/content/goats/admin`,
  UPDATE_GOAT: (id) => `${BASE_URL}/api/content/goats/${id}`,
  DELETE_GOAT: (id) => `${BASE_URL}/api/content/goats/${id}`,

  // Piggery Management
CREATE_PIGGERY: `${BASE_URL}/api/content/piggeries`,
GET_PIGGERIES: `${BASE_URL}/api/content/piggeries`,
GET_ADMIN_PIGGERIES: `${BASE_URL}/api/content/piggeries/admin`,
GET_PIGGERY: (id) => `${BASE_URL}/api/content/piggeries/${id}`,
UPDATE_PIGGERY: (id) => `${BASE_URL}/api/content/piggeries/${id}`,
DELETE_PIGGERY: (id) => `${BASE_URL}/api/content/piggeries/${id}`,

// Dairy Management
CREATE_DAIRY: `${BASE_URL}/api/content/dairies`,
GET_DAIRIES: `${BASE_URL}/api/content/dairies`,
GET_ADMIN_DAIRIES: `${BASE_URL}/api/content/dairies/admin`,
GET_DAIRY: (id) => `${BASE_URL}/api/content/dairies/${id}`,
UPDATE_DAIRY: (id) => `${BASE_URL}/api/content/dairies/${id}`,
DELETE_DAIRY: (id) => `${BASE_URL}/api/content/dairies/${id}`,

// Beef Management
CREATE_BEEF: `${BASE_URL}/api/content/beefs`,
GET_BEEFS: `${BASE_URL}/api/content/beefs`,
GET_ADMIN_BEEFS: `${BASE_URL}/api/content/beefs/admin`,
GET_BEEF: (id) => `${BASE_URL}/api/content/beefs/${id}`,
UPDATE_BEEF: (id) => `${BASE_URL}/api/content/beefs/${id}`,
DELETE_BEEF: (id) => `${BASE_URL}/api/content/beefs/${id}`,

  // Event Management
  CREATE_EVENT: `${BASE_URL}/api/content/events`,
  GET_EVENTS: `${BASE_URL}/api/content/events`,
  GET_ADMIN_EVENTS: `${BASE_URL}/api/content/events/admin`,
  GET_EVENT: (id) => `${BASE_URL}/api/content/events/${id}`,
  UPDATE_EVENT: (id) => `${BASE_URL}/api/content/events/${id}`,
  DELETE_EVENT: (id) => `${BASE_URL}/api/content/events/${id}`,

  // Event Registration Management (Admin)
  GET_EVENT_REGISTRATIONS: (eventId) => `${BASE_URL}/api/content/events/${eventId}/registrations`,
  GET_ALL_EVENT_REGISTRATIONS: `${BASE_URL}/api/content/event-registrations`,
  GET_ADMIN_EVENT_REGISTRATIONS: `${BASE_URL}/api/content/event-registrations/admin`,
  GET_ADMIN_REGISTRATIONS: `${BASE_URL}/api/content/event-registrations/admin`,
  DELETE_EVENT_REGISTRATION: (registrationId) => `${BASE_URL}/api/content/event-registrations/${registrationId}`,

  // Auction Management
  CREATE_AUCTION: `${BASE_URL}/api/content/auctions`,
  GET_AUCTIONS: `${BASE_URL}/api/content/auctions`,
  GET_UPCOMING_AUCTIONS: `${BASE_URL}/api/content/auctions/upcoming`,
  GET_ADMIN_AUCTIONS: `${BASE_URL}/api/content/auctions/admin`,
  GET_AUCTION: (id) => `${BASE_URL}/api/content/auctions/${id}`,
  UPDATE_AUCTION: (id) => `${BASE_URL}/api/content/auctions/${id}`,
  DELETE_AUCTION: (id) => `${BASE_URL}/api/content/auctions/${id}`,
  REGISTER_AUCTION_INTEREST: (id) => `${BASE_URL}/api/content/auctions/${id}/register`,

  CREATE_SUBSCRIBER: `${BASE_URL}/api/content/subscribers`,
  GET_SUBSCRIBERS: `${BASE_URL}/api/content/subscribers`,
  GET_ADMIN_SUBSCRIBERS: `${BASE_URL}/api/content/subscribers`,
  DELETE_SUBSCRIBER: (id) => `${BASE_URL}/api/content/subscribers/${id}`,
  BULK_UPDATE_SUBSCRIBERS: `${BASE_URL}/api/content/subscribers/bulk`,

  // Event Registration Management
  GET_ADMIN_REGISTRATIONS: `${BASE_URL}/api/content/event-registrations/admin`,
  DELETE_EVENT_REGISTRATION: (id) => `${BASE_URL}/api/content/event-registrations/${id}`,

  // NEWSLETTER ENDPOINTS
  CREATE_NEWSLETTER: `${BASE_URL}/api/content/newsletters`,
  GET_NEWSLETTERS: `${BASE_URL}/api/content/newsletters`,
  GET_ADMIN_NEWSLETTERS: `${BASE_URL}/api/content/newsletters/admin`,
  UPDATE_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}`,
  DELETE_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}`,
  SEND_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}/send`,

  // ENGAGEMENT TRACKING ENDPOINTS
  TRACK_VIEW: (contentType, id) => `${BASE_URL}/api/content/${contentType}/${id}/view`,
  TRACK_LIKE: (contentType, id) => `${BASE_URL}/api/content/${contentType}/${id}/like`,
  TRACK_SHARE: (contentType, id) => `${BASE_URL}/api/content/${contentType}/${id}/share`,
  GET_ENGAGEMENT_STATS: (contentType, id) => `${BASE_URL}/api/content/${contentType}/${id}/stats`,
  
  // COMMENT MANAGEMENT ENDPOINTS
  ADD_COMMENT: (contentType, id) => `${BASE_URL}/api/content/${contentType}/${id}/comments`,
  DELETE_COMMENT: (contentType, id, commentId) => `${BASE_URL}/api/content/${contentType}/${id}/comments/${commentId}`,
  APPROVE_COMMENT: (contentType, id, commentId) => `${BASE_URL}/api/content/${contentType}/${id}/comments/${commentId}/approve`,

  // EMAIL TESTING ENDPOINTS
  EMAIL_CONFIG_STATUS: `${BASE_URL}/api/email/status`,
  EMAIL_TEST_CONFIG: `${BASE_URL}/api/email/test/config`,
  EMAIL_TEST_SEND: `${BASE_URL}/api/email/test/send`,
  EMAIL_TEST_WELCOME: `${BASE_URL}/api/email/test/welcome`,
  EMAIL_HEALTH_CHECK: `${BASE_URL}/api/email/test/health`,

  // EMAIL TRACKING ENDPOINTS
  EMAIL_TRACK_OPEN: (newsletterId, email) => `${BASE_URL}/api/email/track/open/${newsletterId}/${encodeURIComponent(email)}`,
  EMAIL_TRACK_CLICK: (newsletterId, email) => `${BASE_URL}/api/email/track/click/${newsletterId}/${encodeURIComponent(email)}`,

  // EMAIL ANALYTICS ENDPOINTS
  EMAIL_NEWSLETTER_ANALYTICS: (newsletterId) => `${BASE_URL}/api/email/analytics/newsletter/${newsletterId}`,
  EMAIL_OVERALL_ANALYTICS: `${BASE_URL}/api/email/analytics/overall`

};

export default API_ENDPOINTS;
