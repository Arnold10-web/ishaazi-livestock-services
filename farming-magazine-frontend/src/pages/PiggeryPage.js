import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PiggeryList from '../components/PiggeryList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/PiggeryPage.css';

const PiggeryPage = () => {
  const [piggeries, setPiggeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPiggeries = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/piggeries`);
        setPiggeries(response.data.data.piggeries);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching piggeries:', err);
        setError('Failed to fetch piggery information. Please try again later.');
        setLoading(false);
      }
    };

    fetchPiggeries();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="piggery-page">
      <h1 className="page-title">Piggery Management</h1>
      <PiggeryList piggeries={piggeries} apiBaseUrl={API_BASE_URL} />
    </div>
    <Footer />
    </div>
  );
};

export default PiggeryPage;