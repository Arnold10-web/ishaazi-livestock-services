// src/pages/FarmPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FarmList from '../components/FarmList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/FarmPage.css'; // Update the CSS import

const FarmPage = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceFilter, setPriceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/farms`);
        console.log('API Response:', response.data); // Log the response for debugging
        if (response.data && response.data.data && Array.isArray(response.data.data.farms)) {
          setFarms(response.data.data.farms);
        } else {
          throw new Error('Invalid response structure');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError(err.response?.data?.message || 'Failed to fetch farms. Please try again later.');
        setLoading(false);
      }
    };

    fetchFarms();
  }, [API_BASE_URL]);

  const filteredFarms = farms.filter((farm) => {
    return (
      (!priceFilter || farm.price <= parseInt(priceFilter)) &&
      (!locationFilter || farm.location.toLowerCase().includes(locationFilter.toLowerCase()))
    );
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="farm-page">
      <h1 className="page-title">Farms For Sale</h1>
      <div className="filters">
        <input
          type="number"
          placeholder="Max Price"
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="filter-input"
        />
        <input
          type="text"
          placeholder="Location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      <FarmList farms={filteredFarms} apiBaseUrl={API_BASE_URL} />
    </div>
    <Footer />
    </div>
  );
};

export default FarmPage;