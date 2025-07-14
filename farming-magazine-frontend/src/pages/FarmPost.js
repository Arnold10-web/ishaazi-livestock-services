import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EnhancedArticleLayout from '../components/EnhancedArticleLayout';

const FarmPost = () => {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentFarms, setRecentFarms] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/farms/${id}`);
        const farmData = response.data.data;

        // Map farm fields to match expected article structure
        farmData.title = farmData.name; // Use farm name as title
        farmData.content = farmData.description; // Use description as content

        setFarm(farmData);
        document.title = `${farmData.title} | Ishaazi Livestock Services`;

        // Fetch recent farms for sidebar
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/farms?limit=4`);
        const filteredRecentFarms = recentResponse.data.data.farms.filter(item => item._id !== id);
        setRecentFarms(filteredRecentFarms);

        setError(null);
      } catch (err) {
        console.error('Error fetching farm post:', err);
        setError('Failed to fetch farm information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  return (
    <EnhancedArticleLayout
      article={farm}
      loading={loading}
      error={error}
      recentPosts={recentFarms}
      backLink="/farm"
      backLabel="Farms"
      category="Farm Listing"
    />
  );
};

export default FarmPost;
