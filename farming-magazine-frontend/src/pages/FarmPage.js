// src/pages/FarmPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import FarmList from '../components/FarmList';

import Footer from '../components/Footer';


const FarmPage = () => {
  // State hooks for farms data, loading, error, and filters
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceFilter, setPriceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch farms data on mount
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/farms`);
        console.log('API Response:', response.data);
        if (response.data && response.data.data && Array.isArray(response.data.data.farms)) {
          setFarms(response.data.data.farms);
          setError(null);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError(err.response?.data?.message || 'Failed to fetch farms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [API_BASE_URL]);

  // Filter farms based on search term, price, and location
  const filteredFarms = farms.filter((farm) => {
    const matchesPrice = !priceFilter || farm.price <= parseInt(priceFilter);
    const matchesLocation = !locationFilter || farm.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      (farm.title && farm.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPrice && matchesLocation && matchesSearch;
  });

  // Loading state view with animated spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
   
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading farms...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state view with animated error message and a retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
      
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center"
          >
            <svg 
              className="w-12 h-12 text-red-500 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
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

  // Main FarmPage content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Heading */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Farms For Sale</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the best farms available with our comprehensive listings.
          </p>
        </motion.div>

        {/* Search and Filter Controls */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search farms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Price and Location Filters */}
          <div className="space-x-4">
            <input
              type="number"
              placeholder="Max Price"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Render the filtered list of farms */}
        <FarmList farms={filteredFarms} apiBaseUrl={API_BASE_URL} />
      </main>
      <Footer />
    </motion.div>
  );
};

export default FarmPage;
