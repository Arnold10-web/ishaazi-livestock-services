import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import DairyList from '../components/DairyList';

import Footer from '../components/Footer';

const DairyPage = () => {
  // State hooks for dairies, loading, and error management
  const [dairies, setDairies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL for the API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch dairies data on component mount
  useEffect(() => {
    const fetchDairies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/dairies`);
        setDairies(response.data.data.dairies);
        setError(null);
      } catch (err) {
        console.error('Error fetching dairies:', err);
        setError('Failed to fetch dairies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDairies();
  }, [API_BASE_URL]);

  // Render a loading state with an animated spinner
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
          <p className="mt-4 text-gray-600 font-medium">Loading dairies...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Render an error state with a retry button and animation
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Oops! Something went wrong
            </h2>
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

  // Main DairyPage content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
    
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dairy Management
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your dairies effectively and efficiently.
          </p>
        </motion.div>

        {/* Render the DairyList component with the fetched data */}
        <DairyList dairies={dairies} apiBaseUrl={API_BASE_URL} />
      </main>
      <Footer />
    </motion.div>
  );
};

export default DairyPage;
