import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DairyList from '../components/DairyList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/DairyPage.css';

const DairyPage = () => {
  const [dairies, setDairies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDairies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/dairies`);
        setDairies(response.data.data.dairies);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dairies:', err);
        setError('Failed to fetch dairies. Please try again later.');
        setLoading(false);
      }
    };

    fetchDairies();
  }, [API_BASE_URL]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="dairy-page">
      <h1 className="page-title">Dairy Management</h1>
      <DairyList dairies={dairies} apiBaseUrl={API_BASE_URL} />
    </div>
    <Footer />
    </div>
  );
};

export default DairyPage;