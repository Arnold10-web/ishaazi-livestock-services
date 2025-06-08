import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Loader2, 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw,
  PiggyBank,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  ArrowUpDown,
  Grid3X3,
  List,
  Tag,
  Star,
  Heart,
  BarChart3,
  Zap,
  Sparkles
} from 'lucide-react';
import PiggeryList from '../components/PiggeryList';
import Footer from '../components/Footer';

const PiggeryPage = () => {
  const [piggeries, setPiggeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const piggeryPerPage = 6;

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/piggeries`);
        setPiggeries(res.data.data.piggeries);
        setError(null);
      } catch (err) {
        console.error('Error fetching piggeries:', err);
        setError('Failed to fetch piggery information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  const filteredAndSortedPiggeries = piggeries
    .filter(piggery => {
      const matchesSearch = piggery.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           piggery.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           piggery.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || piggery.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  const indexOfLast = currentPage * piggeryPerPage;
  const indexOfFirst = indexOfLast - piggeryPerPage;
  const currentPiggeries = filteredAndSortedPiggeries.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAndSortedPiggeries.length / piggeryPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-gray-900 dark:via-pink-900/10 dark:to-fuchsia-900/10">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-fuchsia-200/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: 180, scale: [1, 1.2, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-pink-200/25 to-rose-200/25 rounded-full blur-3xl"
          />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 text-center max-w-md w-full mx-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <PiggyBank className="h-16 w-16 text-pink-600 dark:text-pink-400" />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-pink-600 dark:text-pink-400 mx-auto mb-4" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Loading Piggery Content
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Gathering the latest pig farming insights...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-gray-900 dark:via-pink-900/10 dark:to-fuchsia-900/10">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-md w-full text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-gray-900 dark:via-pink-900/10 dark:to-fuchsia-900/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: backgroundY }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: backgroundY }}
          animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-fuchsia-200/20 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: backgroundY }}
          animate={{ rotate: 180, scale: [1, 1.2, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-pink-200/25 to-rose-200/25 rounded-full blur-3xl"
        />
      </div>

      {/* Enhanced Header */}
      <motion.header 
        style={{ y: headerY }}
        className="relative bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 py-20 text-center text-white overflow-hidden"
      >
        {/* Header Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mr-4"
            >
              <PiggyBank className="h-12 w-12 text-white" />
            </motion.div>
            <div className="text-left">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-bold bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent"
              >
                Piggery Management
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-1 bg-gradient-to-r from-rose-300 to-fuchsia-300 rounded-full mt-2"
              />
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-pink-100 max-w-2xl mx-auto leading-relaxed"
          >
            Comprehensive pig farming records, breeding insights, and swine management solutions for modern agriculture
          </motion.p>

          {/* Header Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-3xl font-bold text-rose-200"
              >
                {piggeries.length}+
              </motion.div>
              <div className="text-pink-200 text-sm">Records</div>
            </div>
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-3xl font-bold text-rose-200"
              >
                30K+
              </motion.div>
              <div className="text-pink-200 text-sm">Farmers</div>
            </div>
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-3xl font-bold text-rose-200"
              >
                92%
              </motion.div>
              <div className="text-pink-200 text-sm">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Enhanced Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { icon: TrendingUp, label: "Trending", value: "18", color: "from-pink-500 to-rose-500" },
            { icon: Users, label: "Contributors", value: "15+", color: "from-rose-500 to-fuchsia-500" },
            { icon: Calendar, label: "This Month", value: "12", color: "from-pink-600 to-pink-500" },
            { icon: Eye, label: "Total Views", value: "38K", color: "from-rose-600 to-pink-600" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/20 dark:border-gray-700/30 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search piggery records, breeding data, management tips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 focus:ring-2 focus:ring-pink-500/50 focus:border-transparent text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-300"
              />
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </motion.div>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:from-pink-600 hover:to-rose-600 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Filter className="w-5 h-5" />
                Filters
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="px-6 py-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-all duration-300"
              >
                <ArrowUpDown className="w-5 h-5" />
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </motion.button>

              {/* View Mode Toggle */}
              <div className="flex bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-200/50 dark:border-gray-600/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'
                  }`}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200/30 dark:border-gray-600/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 text-gray-900 dark:text-white backdrop-blur-sm focus:ring-2 focus:ring-pink-500/50"
                    >
                      <option value="all">All Categories</option>
                      <option value="breeding">Breeding</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="health">Health Management</option>
                      <option value="housing">Housing & Environment</option>
                      <option value="economics">Farm Economics</option>
                    </select>
                  </div>

                  {/* Quick Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Popular Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {['Free-range', 'Organic Farming', 'Breeding Programs', 'Swine Health', 'Feed Management', 'Biosecurity'].map((tag) => (
                        <motion.button
                          key={tag}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-800/40 dark:hover:to-rose-800/40 transition-all duration-300 flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <BarChart3 className="w-5 h-5" />
            <span>
              Showing {currentPiggeries.length} of {filteredAndSortedPiggeries.length} piggery records
              {searchTerm && ` for "${searchTerm}"`}
            </span>
          </div>
          {filteredAndSortedPiggeries.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Star className="w-4 h-4 text-yellow-500" />
              Curated by farming experts
            </div>
          )}
        </motion.div>

        {/* Piggery Content List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${viewMode}-${selectedCategory}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <PiggeryList 
              piggery={currentPiggeries} 
              apiBaseUrl={API_BASE_URL} 
              viewMode={viewMode}
            />
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center items-center mt-12 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-300 shadow-lg"
            >
              Previous
            </motion.button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <motion.button
                    key={pageNumber}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-12 h-12 rounded-xl font-medium transition-all duration-300 ${
                      currentPage === pageNumber
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                        : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNumber}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-300 shadow-lg"
            >
              Next
            </motion.button>
          </motion.div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default PiggeryPage;
