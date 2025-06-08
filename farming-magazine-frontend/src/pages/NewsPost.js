import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const NewsPost = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentNews, setRecentNews] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [headings, setHeadings] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        const data = res.data.data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.content, 'text/html');
        const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
        const extracted = headingElements.map((el, i) => ({
          id: `heading-${i}`,
          text: el.textContent,
          level: el.tagName.toLowerCase()
        }));

        headingElements.forEach((el, i) => (el.id = `heading-${i}`));
        data.content = doc.body.innerHTML;

        setNews(data);
        setHeadings(extracted);
        
        // Fetch related news
        const fetchRelatedNews = async () => {
          try {
            const allNews = await axios.get(`${API_BASE_URL}/api/content/news?limit=20`);
            const related = allNews.data.data.news
              .filter(n => n._id !== id)
              .filter(n => {
                const hasCommonTags = data.tags && n.tags && 
                  data.tags.some(tag => n.tags.includes(tag));
                const hasCommonCategory = data.category && n.category === data.category;
                return hasCommonTags || hasCommonCategory;
              })
              .slice(0, 4);
            setRelatedNews(related);
          } catch (error) {
            console.error('Error fetching related news:', error);
          }
        };
        
        fetchRelatedNews();

        const recent = await axios.get(`${API_BASE_URL}/api/content/news?limit=3`);
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
  }, [id, API_BASE_URL]);

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  return (
    <ArticleDetailTemplate
      article={news}
      contentType="news"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentNews}
      relatedPosts={relatedNews}
      backPath="/news"
      backLabel="News"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};

export default NewsPost;