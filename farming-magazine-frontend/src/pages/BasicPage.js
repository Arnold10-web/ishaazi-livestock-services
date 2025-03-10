import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import Footer from '../components/Footer';
import BasicList from '../components/BasicList';

const BasicPage = () => {
  // State hooks for basics data, loading, error, and pagination
  const [basics, setBasics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  // Ensure the API_BASE_URL is consistent throughout the app
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Create a stable axios instance with increased timeout
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased from 15000 to 30000
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  // Fetch basics with pagination using useCallback for memoization
  const fetchBasics = useCallback(async () => {
    try {
      // Only show loading indicator on initial load or page change, not on retries
      if (basics.length === 0 || retryCount === 0) {
        setLoading(true);
      }
      
      const response = await axiosInstance.get(`/api/content/basics?page=${page}&limit=5`);
      
      if (response.data && response.data.data) {
        const { basics = [], totalPages = 1 } = response.data.data;
        
        // Process media items to ensure they're properly formatted
        const processedBasics = basics.map(item => ({
          ...item,
          comments: Array.isArray(item.comments) ? item.comments : [],
          // Don't add timestamp to prevent unnecessary reloads
          imageUrl: item.imageUrl || null,
          fileUrl: item.fileUrl || null,
          // Ensure we have proper file type information
          fileType: item.fileType || (
            item.fileUrl?.toLowerCase().endsWith('.mp4') || 
            item.fileUrl?.toLowerCase().endsWith('.webm') || 
            item.fileUrl?.toLowerCase().endsWith('.mov') ? 'video' :
            item.fileUrl?.toLowerCase().endsWith('.mp3') || 
            item.fileUrl?.toLowerCase().endsWith('.wav') ? 'audio' : null
          )
        }));
        
        setBasics(processedBasics);
        setTotalPages(totalPages);
        setError(null);
        setRetryCount(0);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching basics:', err);
      // Keep existing data if we have it
      if (basics.length === 0) {
        setError(err.message === 'timeout of 30000ms exceeded' 
          ? 'The server is taking too long to respond. Please try again later.' 
          : 'Failed to fetch content. Please try again later.');
      } else {
        // Show toast or non-intrusive error if we already have data
        console.warn('Error refreshing data, but using cached data');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, page, axiosInstance, basics.length, retryCount]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        await fetchBasics();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Fetch error:', error);
        }
      }
    };
    
    fetchData();
    
    return () => {
      controller.abort();
    };
  }, [fetchBasics, page]);

  // Handle adding a comment with optimistic updates
  const handleAddComment = async (basicId, content) => {
    if (!basicId || !content) return;
    
    // Optimistically update the UI
    const updatedBasics = basics.map(basic => {
      if (basic._id === basicId) {
        return {
          ...basic,
          comments: [...basic.comments, { _id: Date.now(), content }]
        };
      }
      return basic;
    });
    setBasics(updatedBasics);
    
    try {
      await axiosInstance.post(`/api/content/basics/${basicId}/comments`, { content });
      // Don't refetch data, just keep the optimistic update
    } catch (err) {
      console.error('Error adding comment:', err);
      // Revert the optimistic update
      setBasics(basics);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Handle retry with exponential backoff
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchBasics();
  };

  // Pagination handlers with smooth scroll
  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  // Render the loading state with an animated spinner
  if (loading && basics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading content...</p>
          {retryCount > 0 && (
            <p className="mt-2 text-gray-500">Retrying... (Attempt {retryCount})</p>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // Render the error state with an animated error container and a retry button
  if (error && basics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // Main content with a fade-in transition
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Media</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our latest media content and engage with our community.
          </p>
        </motion.div>

        {/* Render the BasicList component with comment functionality */}
        <BasicList
          basics={basics}
          apiBaseUrl={API_BASE_URL}
          isAdmin={false}
          onAddComment={handleAddComment}
          isLoading={loading}
        />

        {/* Show loading indicator for subsequent page loads */}
        {loading && basics.length > 0 && (
          <div className="flex justify-center my-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Refreshing...</span>
          </div>
        )}

        {/* Error message if we failed to refresh but have data */}
        {error && basics.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center justify-between my-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-amber-700 text-sm">Couldn't refresh content. Using cached data.</p>
            </div>
            <button 
              onClick={handleRetry}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-8">
            <button
              disabled={page <= 1 || loading}
              onClick={goToPrevPage}
              className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={goToNextPage}
              className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </motion.div>
  );
};

export default BasicPage;
