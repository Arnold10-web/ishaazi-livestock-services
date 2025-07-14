import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

const PiggeryPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/piggeries/${id}`);
        const data = res.data.data;

        setPost(data);
        document.title = `${data.title} | Ishaazi Livestock Services`;

        const recent = await axios.get(`${API_BASE_URL}/api/content/piggeries?limit=4`);
        setRecentPosts(recent.data.data.piggeries.filter(p => p._id !== id));

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load piggery details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);



  return (
    <EnhancedArticleLayout
      article={post}
      loading={loading}
      error={error}
      recentPosts={recentPosts}
      backLink="/piggery"
      backLabel="Piggery"
      category="Pig Farming"
    />
  );
};

export default PiggeryPost;
