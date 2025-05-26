import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Search, AlertCircle, Home, MapPin, DollarSign, Filter, X, Tractor } from 'lucide-react';
import FarmList from '../components/FarmList';


const FarmPage = () => {
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

  // Handle price filter input with comma-separated formatting
  const handlePriceFilterChange = (e) => {
    // Remove non-digit characters and allow commas
    const value = e.target.value.replace(/[^0-9,]/g, '');
    setPriceFilter(value);
  };

  // Filter farms based on search term, price, and location
  const filteredFarms = farms.filter((farm) => {
    // Remove commas and convert to number for price comparison
    const maxPrice = priceFilter ? Number(priceFilter.replace(/,/g, '')) : null;
    const matchesPrice = !maxPrice || farm.price <= maxPrice;
    const matchesLocation = !locationFilter || farm.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      (farm.title && farm.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPrice && matchesLocation && matchesSearch;
  });

  // Loading state view with animated spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-gray-800 shadow-sm rounded-xl p-8 border border-gray-100 dark:border-gray-700">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full"
              >
                <Loader2 className="w-12 h-12 text-green-500 dark:text-green-400" />
              </motion.div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">Loading farms...</p>
              <div className="mt-6 w-full max-w-md">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-green-500 dark:bg-green-400" 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state view with animated error message and a retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-4"
              >
                <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Oops! Something went wrong</h2>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">{error}</p>
              
              <motion.button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main FarmPage content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center p-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Home className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Farms For Sale</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the best farms available with our comprehensive listings. Find your perfect agricultural property today.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <motion.a 
              href="#farm-listings" 
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Browse Farms
            </motion.a>
            <motion.a 
              href="#farm-resources" 
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Resources
            </motion.a>
          </div>
        </motion.div>

        {/* Search and Filter Controls */}
        <div className="max-w-4xl mx-auto mb-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
            <Filter className="w-5 h-5 text-green-500 dark:text-green-400" />
            <h2 className="text-lg font-semibold">Search & Filter</h2>
          </div>
          
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search farms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Price Filter */}
            <div className="relative md:w-1/4">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Max Price (UGX)"
                value={priceFilter}
                onChange={handlePriceFilterChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Location Filter */}
            <div className="relative md:w-1/4">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || priceFilter || locationFilter) && (
              <motion.button
                onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('');
                  setLocationFilter('');
                }}
                className="flex items-center justify-center gap-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <X size={16} />
                Clear
              </motion.button>
            )}
          </div>
          
          {/* Filter Stats */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Showing {filteredFarms.length} {filteredFarms.length === 1 ? 'farm' : 'farms'}
              {(searchTerm || priceFilter || locationFilter) ? ' matching your filters' : ''}
            </p>
          </div>
        </div>

        {/* Farm Listings */}
        <div id="farm-listings" className="scroll-mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Available Farms</h2>
          </div>
          <FarmList farms={filteredFarms} apiBaseUrl={API_BASE_URL} isLoading={loading} />
        </div>
        
        {/* Farm Resources Section */}
        <div id="farm-resources" className="mt-16 scroll-mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">Farm Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Buying Guide</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Learn everything you need to know before purchasing a farm property.</p>
              <a href="#" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                Read Guide
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Financing Options</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Explore different financing solutions to help you purchase your dream farm.</p>
              <a href="#" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                Learn More
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Schedule a Visit</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Book an appointment to visit any of our listed farms with our expert agents.</p>
              <a href="#" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                Book Now
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default FarmPage;