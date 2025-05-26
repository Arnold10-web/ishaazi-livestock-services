import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Calendar, Filter, X, Newspaper, AlertTriangle, RefreshCw, ChevronDown, Tag } from 'lucide-react';
import NewsList from '../components/NewsList';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const newsPerPage = 9;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/news`);
        const newsData = response.data.data.news;
        setNews(newsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(newsData
          .filter(item => item.category)
          .map(item => item.category))];
        setCategories(uniqueCategories);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    
    // Handle click outside search to unfocus
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [API_BASE_URL]);

  const dateFilters = [
    { label: 'All Time', value: 'all', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Today', value: 'today', icon: <Calendar className="w-4 h-4" /> },
    { label: 'This Week', value: 'week', icon: <Calendar className="w-4 h-4" /> },
    { label: 'This Month', value: 'month', icon: <Calendar className="w-4 h-4" /> }
  ];
  
  const resetFilters = () => {
    setDateFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Filter news based on search, date and category
  const filteredNews = news.filter(article => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
                         (article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Date filter
    const articleDate = new Date(article.createdAt || article.publishedAt);
    const today = new Date();
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && articleDate.toDateString() === today.toDateString()) ||
      (dateFilter === 'week' && articleDate >= new Date(today - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && articleDate.getMonth() === today.getMonth() && 
                                articleDate.getFullYear() === today.getFullYear());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;

    return matchesSearch && matchesDate && matchesCategory;
  });

  // Pagination
  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(filteredNews.length / newsPerPage);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <Loader2 className="w-16 h-16 text-blue-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading News</h2>
            <p className="text-gray-600 dark:text-gray-400">Fetching the latest stories for you...</p>
            
            {/* Skeleton Loader */}
            <div className="w-full max-w-5xl mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div className="p-6 space-y-4">
                      <div className="flex space-x-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Unable to Load News
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center shadow-md"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center mb-6">
              <Newspaper className="w-8 h-8 text-blue-200 mr-3" />
              <h2 className="text-lg font-medium text-blue-200 uppercase tracking-wider">News & Updates</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Stay Informed with the Latest <span className="text-blue-200">Farming News</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-3xl mx-auto mb-8">
              Discover the latest trends, innovations, and updates in the agricultural industry.
            </p>
            
            {/* Search Bar */}
            <div 
              ref={searchRef}
              className={`relative max-w-2xl mx-auto transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}
            >
              <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full opacity-20 blur-md transform -translate-y-1 scale-105"></div>
              <div className="relative flex items-center">
                <Search 
                  className={`absolute left-4 transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : 'text-white'}`} 
                  size={20} 
                />
                <input
                  type="text"
                  placeholder="Search for news articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all duration-300"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 text-white/70 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="text-gray-50 dark:text-gray-900 w-full h-12 md:h-16">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C0,0,0,0,0,0" fill="currentColor"></path>
          </svg>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12">
        {/* Filters Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <motion.div variants={itemVariants} className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mr-4">
                {filteredNews.length} {filteredNews.length === 1 ? 'Article' : 'Articles'}
              </h2>
              {(searchTerm || dateFilter !== 'all' || categoryFilter !== 'all') && (
                <button 
                  onClick={resetFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset filters
                </button>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <button
                onClick={toggleFilters}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </motion.div>
          </div>
          
          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        Filter by Date
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {dateFilters.map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => setDateFilter(filter.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${dateFilter === filter.value 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                          >
                            {filter.icon}
                            <span className="ml-2">{filter.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Category Filter */}
                    {categories.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <Tag className="w-4 h-4 mr-2 text-blue-500" />
                          Filter by Category
                        </h3>
                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2">
                          <button
                            onClick={() => setCategoryFilter('all')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === 'all' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                          >
                            All Categories
                          </button>
                          {categories.map(category => (
                            <button
                              key={category}
                              onClick={() => setCategoryFilter(category)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate ${categoryFilter === category 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          <NewsList 
            news={currentNews} 
            apiBaseUrl={API_BASE_URL}
            searchTerm={searchTerm}
          />
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center"
            >
              Next
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
      
      {/* Add CSS for the background pattern */}
      <style jsx global>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </motion.div>
  );
};

export default NewsPage;