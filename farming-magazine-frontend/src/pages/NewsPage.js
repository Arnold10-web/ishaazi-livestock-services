import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsList from '../components/NewsList';
import '../css/NewsPage.css'; // Make sure to create this CSS file

const NewsPage = () => {
   
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/news`);
        setNews(response.data.data.news);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
        setLoading(false);
      }
    };

    fetchNews();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="news-page">
      <h1 className="page-title">Latest News</h1>
      <NewsList news={news} apiBaseUrl={API_BASE_URL} />
    </div>
    <Footer />
    </div>
  );
};

export default NewsPage;