import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const BeefPost = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [headings, setHeadings] = useState([]);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/beefs/${id}`);
        const articleData = response.data.data;
        
        if (articleData?.content) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(articleData.content, 'text/html');
          const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
          const extractedHeadings = headingElements.map((heading, index) => ({
            id: `heading-${index}`,
            text: heading.textContent,
            level: heading.tagName.toLowerCase(),
          }));
          
          headingElements.forEach((heading, index) => {
            heading.id = `heading-${index}`;
          });
          
          articleData.content = doc.body.innerHTML;
          setHeadings(extractedHeadings);
        }
        
        setArticle(articleData);
        document.title = `${articleData.title} | Beef Articles`;
        
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/beefs?limit=3`);
        const filteredRecentArticles = recentResponse.data.data.beefs.filter(item => item._id !== id);
        setRecentArticles(filteredRecentArticles);

        // Fetch related posts based on tags or category
        const relatedResponse = await axios.get(`${API_BASE_URL}/api/content/beefs?limit=6`);
        const relatedPosts = relatedResponse.data.data.beefs
          .filter(post => post._id !== id)
          .filter(post => 
            post.tags?.some(tag => articleData.tags?.includes(tag)) ||
            post.category === articleData.category
          )
          .slice(0, 3);
        setRelatedPosts(relatedPosts);
        
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

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  return (
    <ArticleDetailTemplate
      article={article}
      contentType="beefs"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentArticles}
      relatedPosts={relatedPosts}
      backPath="/beef"
      backLabel="Beef Articles"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};

export default BeefPost;
