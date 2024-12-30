import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BasicList from '../components/BasicList';
import '../css/BasicPage.css';

const BasicPage = () => {
  const [basics, setBasics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch basics with pagination
  const fetchBasics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/basics?page=${page}&limit=5`);
      const { basics, totalPages } = response.data.data;
      setBasics(basics);
      setTotalPages(totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching basics:', err);
      setError('Failed to fetch basics. Please try again later.');
      setLoading(false);
    }
  }, [API_BASE_URL, page]);

  useEffect(() => {
    fetchBasics();
  }, [fetchBasics]);

  // Handle adding a comment
  const handleAddComment = async (basicId, content) => {
    try {
      await axios.post(`${API_BASE_URL}/api/content/basics/${basicId}/comments`, { content });
      fetchBasics(); // Refresh the basics list to include the new comment
      alert('Comment added successfully.');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
    <Header showAd={true} />
    <div className="basic-page">
      <h1 className="page-title">Explore Our Media</h1>
      <BasicList 
        basics={basics} 
        apiBaseUrl={API_BASE_URL} 
        isAdmin={false} 
        onAddComment={handleAddComment} // Pass handleAddComment to BasicList
      />
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </button>
        <span>{`Page ${page} of ${totalPages}`}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </button>
      </div>
    </div>
  <Footer />
  </div>
  );
};

export default BasicPage;
