import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Beef } from 'lucide-react';
import BeefList from '../components/BeefList';

const BeefPage = () => {
  // State for beef data, loading and error management
  const [beefs, setBeefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch beef data on component mount
  useEffect(() => {
    const fetchBeefs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/beefs`);
        setBeefs(response.data.data.beefs);
        setError(null);
      } catch (err) {
        console.error('Error fetching beefs:', err);
        setError('Failed to fetch beef information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBeefs();
  }, [API_BASE_URL]);

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
                className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full"
              >
                <Loader2 className="w-12 h-12 text-red-500 dark:text-red-400" />
              </motion.div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">Loading beef information...</p>
              <div className="mt-6 w-full max-w-md">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-500 dark:bg-red-400" 
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
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
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

  // Main BeefPage content with a fade-in transition
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
          <div className="inline-flex items-center justify-center p-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <Beef className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Beef Management</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our comprehensive resources on beef farming, management techniques, and best practices for optimal production.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <motion.a 
              href="#beef-articles" 
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Browse Articles
            </motion.a>
            <motion.a 
              href="#beef-resources" 
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Resources
            </motion.a>
          </div>
        </motion.div>

        {/* Featured Section */}
        <div className="mb-16 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-8 shadow-sm border border-red-100 dark:border-red-900/30">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Quality Beef Production</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">Our articles provide expert insights on raising healthy cattle, optimizing feed efficiency, and implementing sustainable practices for your beef operation.</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Breed selection and genetics</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Nutrition and feeding strategies</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Health management and disease prevention</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img 
                src="/images/beef-cattle.jpg" 
                alt="Beef Cattle" 
                className="rounded-lg shadow-md object-cover w-full h-64 md:h-80"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
                }}
              />
              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md text-sm font-medium text-gray-800 dark:text-white">
                Premium Quality
              </div>
            </div>
          </div>
        </div>

        {/* Beef Articles List */}
        <div id="beef-articles" className="scroll-mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Latest Beef Articles</h2>
            <div className="hidden md:block">
              <motion.button 
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                View All
              </motion.button>
            </div>
          </div>
          <BeefList 
            beefs={beefs} 
            apiBaseUrl={API_BASE_URL} 
            isLoading={loading}
          />
        </div>
        
        {/* Resources Section */}
        <div id="beef-resources" className="mt-16 scroll-mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">Beef Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Beef Guides</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Comprehensive guides on beef production, management, and marketing.</p>
              <a href="#" className="text-red-600 dark:text-red-400 font-medium hover:underline inline-flex items-center">
                View Guides
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tools & Calculators</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Useful tools to help you calculate feed requirements, costs, and profit margins.</p>
              <a href="#" className="text-red-600 dark:text-red-400 font-medium hover:underline inline-flex items-center">
                Access Tools
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Video Tutorials</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Watch expert demonstrations on various aspects of beef farming and management.</p>
              <a href="#" className="text-red-600 dark:text-red-400 font-medium hover:underline inline-flex items-center">
                Watch Videos
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

export default BeefPage;
