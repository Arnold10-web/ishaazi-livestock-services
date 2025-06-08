import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

const NewsPost = () => {
  const { id } = useParams();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentNews, setRecentNews] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        const data = res.data.data;

        setNews(data);

        const recent = await axios.get(`${API_BASE_URL}/api/content/news?limit=4`);
        setRecentNews(recent.data.data.news.filter(n => n._id !== id));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load the article.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <EnhancedArticleLayout
      article={news}
      loading={loading}
      error={error}
      recentPosts={recentNews}
      backLink="/news"
      backLabel="News"
      category="News"
      themeColor="#2D5016"
    />
  );
};

export default NewsPost;