import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

const BlogPost = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const { id } = useParams();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs/${id}`);
        const blogData = response.data.data;

        setBlog(blogData);
        document.title = `${blogData.title} | Ishaazi Livestock Services`;

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
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  return (
    <EnhancedArticleLayout
      article={blog}
      loading={loading}
      error={error}
      recentPosts={recentPosts}
      backLink="/blog"
      backLabel="Blog"
      category="Blog"
      themeColor="#2D5016"
    />
  );
};

export default BlogPost;
