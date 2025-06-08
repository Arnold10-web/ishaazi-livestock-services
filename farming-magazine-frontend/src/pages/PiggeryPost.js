import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const PiggeryPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/content/piggeries/${id}`);
        const data = res.data.data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.content, 'text/html');
        const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
        headingElements.forEach((el, i) => (el.id = `heading-${i}`));
        const extracted = headingElements.map((el, i) => ({
          id: `heading-${i}`,
          text: el.textContent,
          level: el.tagName.toLowerCase()
        }));
        data.content = doc.body.innerHTML;

        setPost(data);
        setHeadings(extracted);
        
        // Fetch related posts
        const fetchRelatedPosts = async () => {
          try {
            const allPosts = await axios.get(`${API_BASE_URL}/api/content/piggeries?limit=20`);
            const related = allPosts.data.data.piggeries
              .filter(p => p._id !== id)
              .filter(p => {
                const hasCommonTags = data.tags && p.tags && 
                  data.tags.some(tag => p.tags.includes(tag));
                const hasCommonCategory = data.category && p.category === data.category;
                return hasCommonTags || hasCommonCategory;
              })
              .slice(0, 4);
            setRelatedPosts(related);
          } catch (error) {
            console.error('Error fetching related posts:', error);
          }
        };
        
        fetchRelatedPosts();

        const recent = await axios.get(`${API_BASE_URL}/api/content/piggeries?limit=3`);
        setRecentPosts(recent.data.data.piggeries.filter(p => p._id !== id));
      } catch (err) {
        console.error(err);
        setError('Unable to load piggery details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
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
      article={post}
      contentType="piggeries"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentPosts}
      relatedPosts={relatedPosts}
      backPath="/piggery"
      backLabel="Piggery"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};

export default PiggeryPost;
