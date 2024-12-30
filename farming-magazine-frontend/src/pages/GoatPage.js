import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GoatList from '../components/GoatList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/GoatPage.css';

const GoatPage = () => {
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  useEffect(() => {
    const fetchGoats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/goats`); // Validate this endpoint
        setGoats(response.data.data.goats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching goat information:', err);
        setError('Failed to fetch goat information. Please try again later.');
        setLoading(false);
      }
    };
  
    fetchGoats();
  }, [API_BASE_URL]); // Ensure dependencies are correct
  
  
  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="goat-page">
      <h1 className="page-title">Goat Information</h1>
      {goats.length > 0 ? (
        <GoatList goats={goats} apiBaseUrl={API_BASE_URL} />
      ) : (
        <p>No goat information available.</p>
      )}
    </div>
    <Footer />
    </div>
  );
};

export default GoatPage;