import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const FarmPost = () => {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentFarms, setRecentFarms] = useState([]);
  const [relatedFarms, setRelatedFarms] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/farms/${id}`);
        const farmData = response.data.data;

        // Extract headings if description has HTML content
        if (farmData?.description || farmData?.content) {
          const content = farmData.description || farmData.content;
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
          const extractedHeadings = headingElements.map((heading, index) => ({
            id: `heading-${index}`,
            text: heading.textContent,
            level: heading.tagName.toLowerCase(),
          }));

          headingElements.forEach((heading, index) => {
            heading.id = `heading-${index}`;
          });

          if (farmData.description) {
            farmData.description = doc.body.innerHTML;
          } else {
            farmData.content = doc.body.innerHTML;
          }
          setHeadings(extractedHeadings);
        }

        setFarm(farmData);

        // Fetch recent farms
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/farms?limit=3`);
        const filteredRecentFarms = recentResponse.data.data.filter(item => item._id !== id);
        setRecentFarms(filteredRecentFarms);

        // Fetch related farms
        const relatedResponse = await axios.get(`${API_BASE_URL}/api/content/farms?limit=6`);
        const relatedFarms = relatedResponse.data.data
          .filter(f => f._id !== id)
          .filter(f => {
            const hasCommonType = farmData.farmType && f.farmType === farmData.farmType;
            const hasCommonLocation = farmData.location && f.location === farmData.location;
            return hasCommonType || hasCommonLocation;
          })
          .slice(0, 3);
        setRelatedFarms(relatedFarms);

        setError(null);
      } catch (err) {
        console.error('Error fetching farm post:', err);
        setError('Failed to fetch farm information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarm();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  return (
    <ArticleDetailTemplate
      article={farm}
      contentType="farms"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentFarms}
      relatedPosts={relatedFarms}
      backPath="/farm"
      backLabel="Farms"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};

export default FarmPost;
