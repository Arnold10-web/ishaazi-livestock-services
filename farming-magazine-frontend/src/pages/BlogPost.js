/**
 * BlogPost Page Component
 * 
 * Individual blog post display page that shows the complete content
 * of a farming blog article with related content suggestions.
 * Uses the EnhancedArticleLayout for consistent presentation.
 * 
 * @module pages/BlogPost
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

/**
 * Renders a complete blog article with related content
 * 
 * @returns {JSX.Element} Rendered blog post page using EnhancedArticleLayout
 */
const BlogPost = () => {
  // State management
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  
  // Get blog ID from URL parameters
  const { id } = useParams();

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Fetch blog article and related content
   * Loads both the current blog and recent posts for the related content section
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get the current blog data
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs/${id}`);
        const blogData = response.data.data;

        // Set blog data and update page title
        setBlog(blogData);
        document.title = `${blogData.title} | Ishaazi Livestock Services`;

        // Get recent blog posts for the related content section, excluding current post
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/blogs?limit=4`);
        const filteredRecentPosts = recentResponse.data.data.blogs.filter(post => post._id !== id);
        setRecentPosts(filteredRecentPosts);

        setError(null);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to fetch blog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Scroll to top when blog changes
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  return (
    <EnhancedArticleLayout
      article={blog}
      loading={loading}
      error={error}
      recentPosts={recentPosts}
      backLink="/blog"
      backLabel="Stories & Insights"
      category="Blog Article"
    />
  );
};

export default BlogPost;
