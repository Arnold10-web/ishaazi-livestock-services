/**
 * List Blogs Script
 * 
 * This script lists all available blogs in the system.
 */

import axios from 'axios';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123';

async function login() {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.token) {
      console.log('✅ Login successful');
      return response.data.token;
    } else {
      console.error('❌ Login failed:', response.data.message || 'No token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function listBlogs(token) {
  try {
    const response = await axios.get(`${API_URL}/content/blogs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data && response.data.data.blogs) {
      const blogs = response.data.data.blogs;
      console.log('✅ Found', blogs.length, 'blogs');
      console.log('\nBlog List:');
      blogs.forEach(blog => {
        console.log('-'.repeat(50));
        console.log(`ID: ${blog._id}`);
        console.log(`Title: ${blog.title}`);
        console.log(`Author: ${blog.author}`);
        console.log(`Tags: ${blog.tags ? JSON.stringify(blog.tags) : 'none'}`);
        console.log(`Category: ${blog.category || 'none'}`);
        console.log(`Created: ${new Date(blog.createdAt).toLocaleString()}`);
        console.log(`Updated: ${new Date(blog.updatedAt).toLocaleString()}`);
      });
      return blogs;
    } else {
      console.error('❌ No blogs found or error retrieving blogs');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching blogs:', error.response?.data?.message || error.message);
    return [];
  }
}

async function main() {
  const token = await login();
  if (!token) process.exit(1);
  
  await listBlogs(token);
}

main();
