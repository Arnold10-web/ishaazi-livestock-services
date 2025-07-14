import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Home, Grid, List
} from 'lucide-react';
import DynamicAdComponent from '../components/DynamicAdComponent';
import FarmList from '../components/FarmList';

// Import adSlots with error handling
let importedAdSlots;
try {
  const { adSlots } = require('../components/DynamicAdComponent');
  importedAdSlots = adSlots;
} catch (error) {
  console.warn('Failed to import adSlots:', error);
  importedAdSlots = null;
}

const FarmPage = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState([0, 2000000000]);
  const farmsPerPage = 12;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Safe fallback for ad slots with comprehensive error handling
  const defaultAdSlots = {
    header: { slot: '1234567890', format: 'horizontal', style: { minHeight: '90px' } },
    inContent: { slot: '1122334455', format: 'rectangle', style: { minHeight: '200px' } },
    footer: { slot: '9988776655', format: 'horizontal', style: { minHeight: '90px' } }
  };
  
  // Use imported adSlots with multiple safety checks
  const adSlots = importedAdSlots || {};
  const safeAdSlots = {
    header: (adSlots?.header && typeof adSlots.header === 'object' && adSlots.header.slot) 
      ? adSlots.header 
      : defaultAdSlots.header,
    inContent: (adSlots?.inContent && typeof adSlots.inContent === 'object' && adSlots.inContent.slot) 
      ? adSlots.inContent 
      : defaultAdSlots.inContent,
    footer: (adSlots?.footer && typeof adSlots.footer === 'object' && adSlots.footer.slot) 
      ? adSlots.footer 
      : defaultAdSlots.footer
  };

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/farms`);
        const farmData = response.data.data.farms || response.data.data || [];
        setFarms(farmData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError('Failed to fetch farm listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [API_BASE_URL]);

  // Apply filters
  const applyFilters = (farms) => {
    let filtered = farms;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(farm =>
        farm.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(farm => {
        const price = farm.price || 0;
        switch (priceFilter) {
          case 'under-100m':
            return price < 100000000;
          case '100m-500m':
            return price >= 100000000 && price <= 500000000;
          case '500m-1b':
            return price >= 500000000 && price <= 1000000000;
          case 'over-1b':
            return price > 1000000000;
          default:
            return true;
        }
      });
    }

    // Custom price range filter
    if (priceRange[0] > 0 || priceRange[1] < 2000000000) {
      filtered = filtered.filter(farm => {
        const price = farm.price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(farm =>
        farm.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(farm => {
        const size = farm.size || 0;
        switch (sizeFilter) {
          case 'small':
            return size < 10;
          case 'medium':
            return size >= 10 && size <= 50;
          case 'large':
            return size > 50;
          default:
            return true;
        }
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(farm =>
        farm.type?.toLowerCase() === typeFilter.toLowerCase() ||
        farm.category?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    return filtered;
  };

  // Apply sorting
  const applySorting = (farms) => {
    switch (sortBy) {
      case 'price-low':
        return [...farms].sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return [...farms].sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'oldest':
        return [...farms].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'newest':
      default:
        return [...farms].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setPriceFilter('all');
    setLocationFilter('all');
    setSizeFilter('all');
    setTypeFilter('all');
    setPriceRange([0, 2000000000]);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const processedFarms = applySorting(applyFilters(farms));
  const indexOfLast = currentPage * farmsPerPage;
  const indexOfFirst = indexOfLast - farmsPerPage;
  const currentFarms = processedFarms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedFarms.length / farmsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">Loading Farm Listings</h2>
              <p className="text-gray-600">Please wait while we fetch the latest properties...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Farms for Sale
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
            Discover premium agricultural properties and farm opportunities across Uganda. 
            Find your perfect farm with our comprehensive listings.
          </p>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search farms by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Prices</option>
                <option value="under-100m">Under UGX 100M</option>
                <option value="100m-500m">UGX 100M - 500M</option>
                <option value="500m-1b">UGX 500M - 1B</option>
                <option value="over-1b">Over UGX 1B</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Locations</option>
                <option value="kampala">Kampala</option>
                <option value="wakiso">Wakiso</option>
                <option value="mukono">Mukono</option>
                <option value="jinja">Jinja</option>
                <option value="mbale">Mbale</option>
                <option value="mbarara">Mbarara</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="flex rounded-lg border border-gray-300">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-l-lg transition ${
                    viewMode === 'grid' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-r-lg transition ${
                    viewMode === 'list' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {indexOfFirst + 1}-{Math.min(indexOfLast, processedFarms.length)} of {processedFarms.length} farms
            </span>
            {(searchTerm || priceFilter !== 'all' || locationFilter !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* In-Content Ad */}
        <div className="mb-8">
          <DynamicAdComponent 
            slot={safeAdSlots.inContent.slot}
            format={safeAdSlots.inContent.format}
            style={safeAdSlots.inContent.style}
          />
        </div>

        {/* Farms Listing */}
        <div className="mb-12">
          <FarmList 
            farms={currentFarms}
            apiBaseUrl={API_BASE_URL}
            isLoading={loading}
            viewMode={viewMode}
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

      {/* Footer Ad */}
      <div className="mt-12">
        <DynamicAdComponent 
          slot={safeAdSlots.footer.slot}
          format={safeAdSlots.footer.format}
          style={safeAdSlots.footer.style}
        />
      </div>
    </div>
  );
};

export default FarmPage;