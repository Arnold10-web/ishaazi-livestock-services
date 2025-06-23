import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Grid, List } from 'lucide-react';
import PiggeryList from '../components/PiggeryList';
import DynamicAdComponent from '../components/DynamicAdComponent';

const PiggeryPage = () => {
  const [piggeries, setPiggeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const piggeriesPerPage = 9;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPiggeries = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/piggeries`, {
          params: {
            page: currentPage,
            limit: piggeriesPerPage
          }
        });
        setPiggeries(response.data.data.piggeries);
        setError(null);
      } catch (err) {
        console.error('Error fetching piggeries:', err);
        setError('Failed to fetch piggery articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPiggeries();
  }, [API_BASE_URL, currentPage]);

  const filteredPiggeries = useMemo(() => {
    return piggeries.filter(piggery =>
      piggery.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piggery.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [piggeries, searchTerm]);

  const currentPiggeries = useMemo(() => {
    const indexOfLast = currentPage * piggeriesPerPage;
    const indexOfFirst = indexOfLast - piggeriesPerPage;
    return filteredPiggeries.slice(indexOfFirst, indexOfLast);
  }, [filteredPiggeries, currentPage, piggeriesPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredPiggeries.length / piggeriesPerPage);
  }, [filteredPiggeries.length, piggeriesPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading Piggery Articles</h2>
              <p className="text-body">Please wait while we fetch the latest content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Something went wrong</h2>
              <p className="text-body mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-heading mb-6">
            Smart Swine Success: Modern Piggery Excellence
          </h1>
          <p className="text-body text-lg md:text-xl max-w-3xl mx-auto">
            Revolutionize your pig farming with innovative breeding programs, health optimization techniques, and sustainable practices that deliver consistent, profitable results.
          </p>
        </div>

        {/* Search and View Mode Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search piggery articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center py-2 px-4 rounded-l-lg transition ${
                  viewMode === 'grid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center py-2 px-4 rounded-r-lg transition ${
                  viewMode === 'list' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Piggery Articles */}
        <div className="mb-12">
          <PiggeryList 
            piggeries={currentPiggeries}
            apiBaseUrl={API_BASE_URL}
            viewMode={viewMode}
            isLoading={loading}
          />
        </div>

        {/* In-Content Ad */}
        <div className="py-8">
          <DynamicAdComponent 
            adSlot="1122334455"
            adFormat="rectangle"
            adStyle={{ minHeight: '200px' }}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-neutral-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PiggeryPage;
