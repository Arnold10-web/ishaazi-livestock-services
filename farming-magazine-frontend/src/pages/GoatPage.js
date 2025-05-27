import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import GoatList from '../components/GoatList';
import Footer from '../components/Footer';

const GoatPage = () => {
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const goatsPerPage = 6;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchGoats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/goats`);
        setGoats(response.data.data.goats);
        setError(null);
      } catch (err) {
        console.error('Error fetching goat information:', err);
        setError('Failed to fetch goat information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGoats();
  }, [API_BASE_URL]);

  const filteredAndSortedGoats = goats
    .filter(goat =>
      goat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goat.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  const indexOfLastGoat = currentPage * goatsPerPage;
  const indexOfFirstGoat = indexOfLastGoat - goatsPerPage;
  const currentGoats = filteredAndSortedGoats.slice(indexOfFirstGoat, indexOfLastGoat);
  const totalPages = Math.ceil(filteredAndSortedGoats.length / goatsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="mt-4 text-gray-700 dark:text-gray-300 font-semibold">Loading goat content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Oops! Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-green-600 py-12 text-center text-white">
        <h1 className="text-4xl font-bold">Goat Management</h1>
        <p className="mt-2 text-green-100">Expert information on goat farming and breeding techniques</p>
      </header>

      <main className="container mx-auto px-4 py-10">
        {/* Search and Sort Controls */}
        <div className="max-w-4xl mx-auto mb-10 grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search goat articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center justify-center px-5 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <ArrowUpDown className="w-5 h-5 mr-2" />
            Sort by {sortOrder === 'newest' ? 'Oldest' : 'Newest'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <GoatList goats={currentGoats} apiBaseUrl={API_BASE_URL} isLoading={loading} />
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex justify-center mt-10 space-x-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 text-sm"
            >Previous</button>

            <span className="text-gray-700 dark:text-gray-300 text-sm pt-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 text-sm"
            >Next</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GoatPage;
