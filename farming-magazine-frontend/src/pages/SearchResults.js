// Enhanced SearchResults.js with highlighting and advanced features
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  Filter, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Eye, 
  Clock,
  Sparkles,
  SortDesc,
  SortAsc,
  Zap,
  Hash,
  TrendingUp
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SearchFilters from '../components/SearchFilters';
import SEOHelmet from '../components/SEOHelmet';
import LazyImage from '../components/LazyImage';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const contentType = searchParams.get('type') || 'all';
  const sortBy = searchParams.get('sort') || 'relevance';
  const fuzzy = searchParams.get('fuzzy') === 'true';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contentTypeCounts, setContentTypeCounts] = useState({});
  const [searchMeta, setSearchMeta] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    dateRange: { start: '', end: '' },
    tags: [],
    minViews: '',
    sortBy: 'relevance'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Content type options with nice labels and icons
  const contentTypeOptions = [
    { id: 'all', label: 'All Content', icon: '📄' },
    { id: 'blog', label: 'Blog Posts', icon: '📝' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'dairy', label: 'Dairy', icon: '🐄' },
    { id: 'beef', label: 'Beef', icon: '🥩' },
    { id: 'piggery', label: 'Piggery', icon: '🐷' },
    { id: 'goat', label: 'Goats', icon: '🐐' },
    { id: 'farm', label: 'Farms', icon: '🚜' },
    { id: 'basic', label: 'Farm Basics', icon: '🌱' }
  ];

  // Sort options
  const sortOptions = [
    { id: 'relevance', label: 'Relevance', icon: <Sparkles size={16} /> },
    { id: 'date', label: 'Newest First', icon: <SortDesc size={16} /> },
    { id: 'title', label: 'A-Z', icon: <SortAsc size={16} /> }
  ];

  // Format date in a readable way
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Estimate read time based on content length
  const estimateReadTime = (content) => {
    if (!content) return '1 min read';
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  // Get content path based on content type
  const getContentPath = (contentType, id) => {
    const pathMap = {
      blog: `/blog/${id}`,
      news: `/news/${id}`,
      dairy: `/dairy/${id}`,
      beef: `/beef/${id}`,
      piggery: `/piggery/${id}`,
      goat: `/goat/${id}`,
      farm: `/farm/${id}`,
      basic: `/basic/${id}`,
    };
    
    return pathMap[contentType] || '/';
  };

  // Get icon for content type
  const getContentTypeLabel = (type) => {
    return contentTypeOptions.find(option => option.id === type)?.label || type;
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    searchParams.set('type', type);
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };

  // Handle sort change
  const handleSortChange = (sort) => {
    searchParams.set('sort', sort);
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };

  // Handle fuzzy search toggle
  const handleFuzzyToggle = () => {
    if (fuzzy) {
      searchParams.delete('fuzzy');
    } else {
      searchParams.set('fuzzy', 'true');
    }
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setSearchFilters(newFilters);
    // Apply filters to search params
    Object.keys(newFilters).forEach(key => {
      if (key === 'dateRange') {
        if (newFilters.dateRange.start) {
          searchParams.set('dateStart', newFilters.dateRange.start);
        } else {
          searchParams.delete('dateStart');
        }
        if (newFilters.dateRange.end) {
          searchParams.set('dateEnd', newFilters.dateRange.end);
        } else {
          searchParams.delete('dateEnd');
        }
      } else if (key === 'tags' && newFilters.tags.length > 0) {
        searchParams.set('tags', newFilters.tags.join(','));
      } else if (key === 'tags') {
        searchParams.delete('tags');
      } else if (newFilters[key]) {
        searchParams.set(key, newFilters[key]);
      } else {
        searchParams.delete(key);
      }
    });
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
    // Scroll to top
    window.scrollTo(0, 0);
  };

  // Create excerpt with highlighting
  const createHighlightedExcerpt = (content, searchQuery, maxLength = 200) => {
    if (!content || !searchQuery) return content?.substring(0, maxLength) + '...' || '';
    
    // Remove HTML tags for excerpt creation
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Find the first occurrence of the search term
    const index = plainText.toLowerCase().indexOf(searchQuery.toLowerCase());
    
    if (index === -1) {
      return plainText.substring(0, maxLength) + '...';
    }
    
    // Create context around the found term
    const start = Math.max(0, index - 50);
    const end = Math.min(plainText.length, start + maxLength);
    let excerpt = plainText.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < plainText.length) excerpt = excerpt + '...';
    
    return excerpt;
  };

  // Render highlighted text
  const renderHighlightedText = (text, searchQuery) => {
    if (!text || !searchQuery) return text;
    
    // If the text already contains highlighting from the backend
    if (text.includes('<mark>')) {
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    
    // Client-side highlighting fallback
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark 
            key={index} 
            className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Fetch search results when query or content type changes
  const fetchResults = useCallback(async () => {
    if (!query) {
      setResults([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      setSearchMeta({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentPage = parseInt(searchParams.get('page')) || 1;
      
      // Build query parameters
      const params = new URLSearchParams({
        query: query,
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
        highlight: 'true',
        fuzzy: fuzzy.toString()
      });

      if (contentType !== 'all') {
        params.append('contentTypes', contentType);
      }

      // Add filter parameters
      if (searchFilters.dateRange.start) {
        params.append('dateStart', searchFilters.dateRange.start);
      }
      if (searchFilters.dateRange.end) {
        params.append('dateEnd', searchFilters.dateRange.end);
      }
      if (searchFilters.tags.length > 0) {
        params.append('tags', searchFilters.tags.join(','));
      }
      if (searchFilters.minViews) {
        params.append('minViews', searchFilters.minViews);
      }

      const endpoint = `${API_BASE_URL}/api/search/all?${params}`;
      
      console.log('🔍 Fetching search results:', endpoint);
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        const { results, pagination: paginationData, searchMeta: meta } = response.data.data;
        
        setResults(results || []);
        setPagination(prev => ({
          ...prev,
          page: paginationData?.currentPage || currentPage,
          total: paginationData?.totalResults || 0
        }));
        setSearchMeta(meta || {});
        
        // Set content type counts if available
        if (response.data.data.contentTypeCounts) {
          setContentTypeCounts(response.data.data.contentTypeCounts);
        }

        // Set available tags if provided
        if (response.data.data.availableTags) {
          setAvailableTags(response.data.data.availableTags);
        }
      } else {
        setError('Failed to fetch search results');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.message || 'An error occurred while searching');
      setResults([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [query, contentType, sortBy, fuzzy, searchParams, pagination.limit, searchFilters, API_BASE_URL]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Generate pagination numbers
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHelmet
        title={`Search Results for "${query}" | Online Farming Magazine`}
        description={`Search results for "${query}" in our farming magazine articles, news, and resources.`}
        keywords={`search, ${query}, farming, agriculture`}
      />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            {query ? `Search Results for "${query}"` : 'Search Our Content'}
          </h1>
          
          <div className="mb-8">
            <SearchBar placeholder="Search for articles, news, and more..." />
          </div>
          
          {/* Advanced Search Options */}
          {(query && !loading) && (
            <div className="mb-6 space-y-4">
              {/* Results Summary and Advanced Options Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {pagination.total} result{pagination.total !== 1 ? 's' : ''} found
                  </h2>
                  {searchMeta.searchTime && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      {searchMeta.searchTime}ms
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mr-4"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {showAdvancedOptions ? 'Hide' : 'Show'} Options
                </button>
                <SearchFilters
                  filters={searchFilters}
                  onFiltersChange={handleFiltersChange}
                  availableTags={availableTags}
                  contentTypeCounts={contentTypeCounts}
                  isVisible={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                />
              </div>

              {/* Advanced Options Panel */}
              <AnimatePresence>
                {showAdvancedOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4"
                  >
                    {/* Sort and Fuzzy Search Controls */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                        <div className="flex space-x-1">
                          {sortOptions.map(option => (
                            <button
                              key={option.id}
                              onClick={() => handleSortChange(option.id)}
                              className={`flex items-center px-3 py-1.5 text-xs rounded-full transition-colors ${
                                sortBy === option.id
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {option.icon}
                              <span className="ml-1">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fuzzy}
                            onChange={handleFuzzyToggle}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fuzzy Search
                          </span>
                        </label>
                        <div className="group relative">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black rounded-lg whitespace-nowrap">
                            Includes similar spellings and typos
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {searchMeta && Object.keys(searchMeta).length > 0 && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        {searchMeta.fuzzySearchUsed && (
                          <span className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Fuzzy search active
                          </span>
                        )}
                        {searchMeta.totalScanned && (
                          <span className="flex items-center">
                            <Hash className="w-3 h-3 mr-1" />
                            {searchMeta.totalScanned} documents scanned
                          </span>
                        )}
                        {searchMeta.suggestions && searchMeta.suggestions.length > 0 && (
                          <span className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {searchMeta.suggestions.length} suggestions available
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Advanced Search Filters */}
              <AnimatePresence>
                {showFilters && (
                  <SearchFilters
                    filters={searchFilters}
                    onFiltersChange={handleFiltersChange}
                    availableTags={availableTags}
                    contentTypeCounts={contentTypeCounts}
                    isVisible={showFilters}
                    onToggle={() => setShowFilters(!showFilters)}
                  />
                )}
              </AnimatePresence>
              
              {/* Content Type Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Types</h3>
                <div className="flex flex-wrap gap-2">
                  {contentTypeOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleContentTypeChange(option.id)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        contentType === option.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                      {contentTypeCounts[option.id] !== undefined && (
                        <span className="ml-1 text-xs opacity-75">
                          ({contentTypeCounts[option.id]})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Results Display */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Searching for "{query}"...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center"
              >
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Search Error</h3>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </motion.div>
            ) : !query ? (
              <motion.div
                key="empty-query"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Enter a search term to begin
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Search our articles, news, and farming resources
                </p>
              </motion.div>
            ) : results.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We couldn't find any matches for "{query}"
                </p>
                <div className="mt-6">
                  <span className="block mb-3 text-sm text-gray-500">Try:</span>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• Using more general keywords</li>
                    <li>• Checking your spelling</li>
                    <li>• Searching different content types</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div key="results" className="space-y-8">
                {results.map((result, index) => (
                  <motion.article
                    key={`${result.contentType}-${result._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-700"
                  >
                    {/* Image */}
                    {result.imageUrl && (
                      <Link to={getContentPath(result.contentType, result._id)} className="md:w-1/3 flex-shrink-0 relative overflow-hidden">
                        <LazyImage
                          src={`${API_BASE_URL}${result.imageUrl}`}
                          alt={result.title}
                          className="w-full h-full object-cover aspect-video md:aspect-auto"
                          fallback="/placeholder-image.jpg"
                        />
                        <div className="absolute top-0 left-0 m-3">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md">
                            {getContentTypeLabel(result.contentType)}
                          </span>
                        </div>
                      </Link>
                    )}
                    
                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <Link
                        to={getContentPath(result.contentType, result._id)}
                        className="group"
                      >
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {renderHighlightedText(result.title, query)}
                        </h2>
                      </Link>
                      
                      <div className="mt-2 mb-3 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(result.createdAt)}
                        </div>
                        
                        {result.views !== undefined && (
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {result.views} views
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {estimateReadTime(result.content)}
                        </div>
                        
                        {result.score !== undefined && (
                          <div className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {Math.round(result.score * 100)}% match
                          </div>
                        )}
                      </div>
                      
                      <div className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">
                        {result.highlightedContent ? (
                          <span dangerouslySetInnerHTML={{ __html: result.highlightedContent }} />
                        ) : (
                          <span>
                            {renderHighlightedText(
                              createHighlightedExcerpt(result.content || result.description, query),
                              query
                            )}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {result.tags && result.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <Link
                          to={getContentPath(result.contentType, result._id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages).keys()].map(pageNum => (
                        <button
                          key={pageNum + 1}
                          onClick={() => handlePageChange(pageNum + 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            pagination.page === pageNum + 1
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, pagination.page + 1))}
                      disabled={pagination.page === totalPages}
                      className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
