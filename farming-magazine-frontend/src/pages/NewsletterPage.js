import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsletterList from '../components/NewsletterList';
import DynamicAdComponent from '../components/DynamicAdComponent';


const NewsletterPage = ({ isAdmin }) => {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/newsletters`);
        setNewsletters(response.data.data.newsletters);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching newsletters:', err);
        setError('Failed to fetch newsletters. Please try again later.');
        setLoading(false);
      }
    };

    fetchNewsletters();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="newsletter-page">
      {/* Header Ad */}
      <div className="py-4">
        <DynamicAdComponent 
          adSlot="1234567890"
          adFormat="horizontal"
          adStyle={{ minHeight: '90px' }}
        />
      </div>

      <h1 className="page-title">Our Newsletters</h1>
      <NewsletterList 
        newsletters={newsletters} 
        apiBaseUrl={API_BASE_URL}
        isAdmin={isAdmin}
      />

      {/* In-Content Ad */}
      <div className="py-8">
        <DynamicAdComponent 
          adSlot="1122334455"
          adFormat="rectangle"
          adStyle={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};

export default NewsletterPage;