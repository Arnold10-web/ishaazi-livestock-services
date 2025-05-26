// src/config/apiConfig.js

// Base URL for your backend API (local or production URL)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
if (!BASE_URL) {
  console.error('BASE_URL is missing. Check your environment variables.');
}
console.log('API Base URL:', BASE_URL);

const API_ENDPOINTS = {
  // Admin Authentication
  ADMIN_REGISTER: `${BASE_URL}/api/admin/register`,
  ADMIN_LOGIN: `${BASE_URL}/api/admin/login`,

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
  ADD_COMMENT: (basicId) => `${BASE_URL}/api/content/basics/${basicId}/comments`,
  DELETE_COMMENT: (basicId, commentId) => `${BASE_URL}/api/content/basics/${basicId}/comments/${commentId}`,


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

  CREATE_SUBSCRIBER: `${BASE_URL}/api/content/subscribers`,
  GET_SUBSCRIBERS: `${BASE_URL}/api/content/subscribers`,
  DELETE_SUBSCRIBER: (id) => `${BASE_URL}/api/content/subscribers/${id}`,

// CREATE_NEWSLETTER: `${BASE_URL}/api/content/newsletters`,
// GET_NEWSLETTERS: `${BASE_URL}/api/content/newsletters`,
// UPDATE_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}`,
// DELETE_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}`,
// SEND_NEWSLETTER: (id) => `${BASE_URL}/api/content/newsletters/${id}/send`

};

export default API_ENDPOINTS;
