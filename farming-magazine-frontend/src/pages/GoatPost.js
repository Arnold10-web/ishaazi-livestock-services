import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const GoatPost = () => {
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
        const response = await axios.get(`${API_BASE_URL}/api/content/goats/${id}`);
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
        document.title = `${articleData.title} | Goat Articles`;
        
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/goats?limit=3`);
        const filteredRecentArticles = recentResponse.data.data.goats.filter(item => item._id !== id);
        setRecentArticles(filteredRecentArticles);
        
        // Fetch related posts
        const fetchRelatedPosts = async () => {
          try {
            const allPosts = await axios.get(`${API_BASE_URL}/api/content/goats?limit=20`);
            const related = allPosts.data.data.goats
              .filter(p => p._id !== id)
              .filter(p => {
                const hasCommonTags = articleData.tags && p.tags && 
                  articleData.tags.some(tag => p.tags.includes(tag));
                const hasCommonCategory = articleData.category && p.category === articleData.category;
                return hasCommonTags || hasCommonCategory;
              })
              .slice(0, 4);
            setRelatedPosts(related);
          } catch (error) {
            console.error('Error fetching related posts:', error);
          }
        };
        
        fetchRelatedPosts();
        
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
      contentType="goats"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentArticles}
      relatedPosts={relatedPosts}
      backPath="/goat"
      backLabel="Goat Articles"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};
export default GoatPost