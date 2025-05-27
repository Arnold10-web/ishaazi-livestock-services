// ========================
// Redesigned PiggeryPost.js
// ========================

// (Already updated above)

// ========================
// Redesigned PiggeryPage.js
// ========================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import PiggeryList from '../components/PiggeryList';

const PiggeryPage = () => {
  const [piggeries, setPiggeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const piggeryPerPage = 6;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/content/piggeries`);
        setPiggeries(res.data.data.piggeries);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch piggeries.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  const filtered = piggeries.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * piggeryPerPage;
  const indexOfFirst = indexOfLast - piggeryPerPage;
  const currentPiggeries = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / piggeryPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center">
        <p className="text-lg text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-green-600 py-12 text-center text-white">
        <h1 className="text-4xl font-bold">Piggery Records</h1>
        <p className="mt-2 text-green-100">Explore detailed piggery information and stats</p>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-auto flex-grow">
            <Search className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search piggeries..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled
          >
            <Filter className="w-4 h-4" /> Filters <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <PiggeryList piggery={currentPiggeries} apiBaseUrl={API_BASE_URL} />
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
            >Previous</button>
            <span className="text-gray-600 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
            >Next</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PiggeryPage;
