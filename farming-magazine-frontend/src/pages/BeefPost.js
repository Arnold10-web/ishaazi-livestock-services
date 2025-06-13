import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

const BeefPost = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/beefs/${id}`);
        const articleData = response.data.data;

        setArticle(articleData);
        document.title = `${articleData.title} | Ishaazi Livestock Services`;

        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/beefs?limit=4`);
        const filteredRecentArticles = recentResponse.data.data.beefs.filter(item => item._id !== id);
        setRecentArticles(filteredRecentArticles);

        setError(null);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to fetch article. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  return (
    <EnhancedArticleLayout
      article={article}
      loading={loading}
      error={error}
      recentPosts={recentArticles}
      backLink="/beef"
      backLabel="Beef"
      category="Beef Farming"
    />
  );
};

export default BeefPost;
