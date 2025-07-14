/**
 * MSW Request Handlers
 * 
 * Mock API endpoints for testing
 */

import { http, HttpResponse } from 'msw';
import { mockData } from '../index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const handlers = [
  // Authentication endpoints
  http.post(`${API_BASE_URL}/admin/login`, async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token',
        user: mockData.user,
      });
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE_URL}/admin/register`, async ({ request }) => {
    const userData = await request.json();
    
    return HttpResponse.json({
      success: true,
      message: 'User registered successfully',
      user: { ...mockData.user, ...userData },
    });
  }),

  // Blog endpoints
  http.get(`${API_BASE_URL}/content/blogs`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    
    return HttpResponse.json({
      success: true,
      data: {
        blogs: [mockData.blog],
        total: 1,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/content/blogs/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockData.blog, _id: params.id },
    });
  }),

  http.post(`${API_BASE_URL}/content/blogs`, async ({ request }) => {
    const blogData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: { ...mockData.blog, ...blogData, _id: 'new-blog-id' },
    });
  }),

  http.put(`${API_BASE_URL}/content/blogs/:id`, async ({ params, request }) => {
    const updates = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: { ...mockData.blog, ...updates, _id: params.id },
    });
  }),

  http.delete(`${API_BASE_URL}/content/blogs/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  }),

  // News endpoints
  http.get(`${API_BASE_URL}/content/news`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        news: [mockData.news],
        total: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/content/news/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockData.news, _id: params.id },
    });
  }),

  http.post(`${API_BASE_URL}/content/news`, async ({ request }) => {
    const newsData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: { ...mockData.news, ...newsData, _id: 'new-news-id' },
    });
  }),

  // Event endpoints
  http.get(`${API_BASE_URL}/content/events`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        events: [mockData.event],
        total: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/content/events/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockData.event, _id: params.id },
    });
  }),

  http.post(`${API_BASE_URL}/content/events`, async ({ request }) => {
    const eventData = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: { ...mockData.event, ...eventData, _id: 'new-event-id' },
    });
  }),

  // Engagement tracking endpoints
  http.post(`${API_BASE_URL}/content/track/view/:contentType/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { views: 101 },
    });
  }),

  http.post(`${API_BASE_URL}/content/track/like/:contentType/:id`, async ({ request }) => {
    const { action } = await request.json();
    const likes = action === 'like' ? 11 : 9;
    
    return HttpResponse.json({
      success: true,
      data: { likes },
    });
  }),

  http.post(`${API_BASE_URL}/content/track/share/:contentType/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: { shares: 6 },
    });
  }),

  // Search endpoints
  http.get(`${API_BASE_URL}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    return HttpResponse.json({
      success: true,
      data: {
        results: query ? [mockData.blog] : [],
        total: query ? 1 : 0,
      },
    });
  }),

  // File upload endpoints
  http.post(`${API_BASE_URL}/upload`, () => {
    return HttpResponse.json({
      success: true,
      file: {
        path: '/uploads/test-image.jpg',
        name: 'test-image.jpg',
        type: 'image/jpeg',
      },
    });
  }),

  // Newsletter endpoints
  http.post(`${API_BASE_URL}/content/subscribers`, async ({ request }) => {
    const { email } = await request.json();
    
    return HttpResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: { email, subscriptionType: 'all' },
    });
  }),

  // Error simulation endpoints
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/error/404`, () => {
    return HttpResponse.json(
      { success: false, message: 'Not found' },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE_URL}/error/network`, () => {
    return HttpResponse.error();
  }),

  // Slow response simulation
  http.get(`${API_BASE_URL}/slow`, async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json({
      success: true,
      data: { message: 'Slow response' },
    });
  }),
];