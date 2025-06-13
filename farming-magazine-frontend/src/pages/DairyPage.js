import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Grid, List } from 'lucide-react';
import DairyList from '../components/DairyList';
import DynamicAdComponent from '../components/DynamicAdComponent';


const DairyPage = () => {
  const [dairies, setDairies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const dairiesPerPage = 9;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDairies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/dairies`, {
          params: {
            page: currentPage,
            limit: dairiesPerPage
          }
        });
        setDairies(response.data.data.dairies);
        setError(null);
      } catch (err) {
        console.error('Error fetching dairies:', err);
        setError('Failed to fetch dairy articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDairies();
  }, [API_BASE_URL, currentPage]);

  const filteredDairies = dairies.filter(dairy =>
    dairy.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dairy.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * dairiesPerPage;
  const indexOfFirst = indexOfLast - dairiesPerPage;
  const currentDairies = filteredDairies.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDairies.length / dairiesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading Dairy Articles</h2>
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
            Excellence in Dairy: Unlock Premium Milk Production
          </h1>
          <p className="text-body text-lg md:text-xl max-w-3xl mx-auto">
            Transform your dairy operation with cutting-edge techniques, proven management strategies, and veterinary insights that maximize yield while ensuring exceptional herd wellness.
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
                placeholder="Search dairy articles..."
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
        {/* Dairy Articles */}
        <div className="mb-12">
          <DairyList 
            dairies={currentDairies}
            apiBaseUrl={API_BASE_URL}
            isLoading={loading}
            viewMode={viewMode}
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
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DairyPage;
