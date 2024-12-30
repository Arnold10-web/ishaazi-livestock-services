import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BlogList from '../components/BlogList';
import '../css/BlogPage.css'; // Add this line to import the CSS file

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs`);
        setBlogs(response.data.data.blogs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to fetch blogs. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="blog-page">
      <h1 className="page-title">Our Blogs</h1>
      <BlogList blogs={blogs} apiBaseUrl={API_BASE_URL} />
    </div>
  );
};

export default BlogPage;