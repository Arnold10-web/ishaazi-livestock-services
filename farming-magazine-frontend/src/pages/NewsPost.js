import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/NewsPost.css';

const NewsPost = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        setNews(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
        setLoading(false);
      }
    };

    fetchNews();
  }, [id, API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!news) return <div className="not-found">News article not found</div>;

  return (
    <article className="news-post">
      <h1 className="news-title">{news.title}</h1>
      {news.imageUrl && (
        <div className="news-image-container">
          <img
            src={`${API_BASE_URL}${news.imageUrl}`}
            alt={news.title}
            className="news-image"
            crossOrigin="anonymous"
          />
        </div>
      )}
      <div className="news-content" dangerouslySetInnerHTML={{ __html: news.content }} />
      <div className="news-metadata">
        <p>Published on: {new Date(news.createdAt).toLocaleDateString()}</p>
        {news.updatedAt && (
          <p>Last updated: {new Date(news.updatedAt).toLocaleDateString()}</p>
        )}
      </div>
    </article>
  );
};

export default NewsPost;