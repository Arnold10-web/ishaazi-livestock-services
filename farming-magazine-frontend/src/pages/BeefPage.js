import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BeefList from '../components/BeefList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/BeefPage.css';

const BeefPage = () => {
  const [beefs, setBeefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchBeefs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/beefs`);
        setBeefs(response.data.data.beefs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching beefs:', err);
        setError('Failed to fetch beef information. Please try again later.');
        setLoading(false);
      }
    };

    fetchBeefs();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="beef-page">
      <h1 className="page-title">Beef Management</h1>
      <BeefList beefs={beefs} apiBaseUrl={API_BASE_URL} />
    </div>
    <Footer />
    </div>
  );
};

export default BeefPage;