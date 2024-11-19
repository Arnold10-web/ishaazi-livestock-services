// src/config/apiConfig.js

// Base URL for your backend API (local or production URL)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {

    ADMIN_REGISTER: `${BASE_URL}/api/auth/register`,
    ADMIN_LOGIN: `${BASE_URL}/api/auth/login`,
    // Media Uploads
    UPLOAD_MEDIA: `${BASE_URL}/api/content/uploadMedia`,  // Consolidated media upload endpoint
    
    // Media Retrieval and Deletion
    GET_MEDIA: (id) => `${BASE_URL}/api/content/media/${id}`,  // Assuming an endpoint for retrieving specific media
    DELETE_MEDIA: (id) => `${BASE_URL}/api/content/media/${id}`, // Delete specific media by ID

    // News Management
    CREATE_NEWS: `${BASE_URL}/api/content/news`,
    GET_NEWS: `${BASE_URL}/api/content/news`,
    UPDATE_NEWS: (id) => `${BASE_URL}/api/content/news/${id}`,
    DELETE_NEWS: (id) => `${BASE_URL}/api/content/news/${id}`,

    // Blog Management
    CREATE_BLOG: `${BASE_URL}/api/content/blog`,
    GET_BLOGS: `${BASE_URL}/api/content/blog`,
    UPDATE_BLOG: (id) => `${BASE_URL}/api/content/blog/${id}`,
    DELETE_BLOG: (id) => `${BASE_URL}/api/content/blog/${id}`,

    // Farm Management
    CREATE_FARM: `${BASE_URL}/api/content/farm`,
    GET_FARMS: `${BASE_URL}/api/content/farm`,
    UPDATE_FARM: (id) => `${BASE_URL}/api/content/farm/${id}`,
    DELETE_FARM: (id) => `${BASE_URL}/api/content/farm/${id}`,

    // Magazine Management
    CREATE_MAGAZINE: `${BASE_URL}/api/content/magazine`,
    GET_MAGAZINES: `${BASE_URL}/api/content/magazine`,
    UPDATE_MAGAZINE: (id) => `${BASE_URL}/api/content/magazine/${id}`,
    DELETE_MAGAZINE: (id) => `${BASE_URL}/api/content/magazine/${id}`,

  
};

export default API_ENDPOINTS;
