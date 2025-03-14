import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriberList from '../components/SubscriberList';


const SubscriberPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/subscribers`);
        setSubscribers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subscribers:', err);
        setError('Failed to fetch subscribers. Please try again later.');
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [API_BASE_URL]);

  const handleDeleteSubscriber = async (subscriberId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/content/subscribers/${subscriberId}`);
      setSubscribers((prev) => prev.filter((sub) => sub._id !== subscriberId));
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      alert('Failed to delete subscriber. Please try again later.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="subscriber-page">
      <h1 className="page-title">Subscribers</h1>
      <SubscriberList
        subscribers={subscribers}
        onDelete={handleDeleteSubscriber}
      />
    </div>
  );
};

export default SubscriberPage;
