import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Loader2, TrendingUp, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const UnifiedSearchBar = ({ 
  contentType = 'all', 
  placeholder = "Search...", 
  onResults = null,
  showFilters = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    tags: [],
    sortBy: 'relevance'
  });
  const [availableTags, setAvailableTags] = useState([]);
  
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch suggestions
  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/suggestions`, {
        params: { query: searchQuery, limit: 8 }
      });
      
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Fetch available tags for the content type
  const fetchAvailableTags = useCallback(async () => {
    if (contentType === 'all') return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/tags/${contentType}`);
      if (response.data.success) {
        setAvailableTags(response.data.data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, [contentType, API_BASE_URL]);

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

  // Handle input change with debounced suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for suggestions
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
      setShowSuggestions(value.length >= 2);
    }, 300);
  };

  // Handle search submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      if (onResults) {
        // Local search for specific pages
        const params = {
          query: query.trim(),
          contentTypes: contentType !== 'all' ? [contentType] : [],
          ...filters,
          page: 1,
          limit: 20
        };

        const response = await axios.get(`${API_BASE_URL}/api/search/all`, { params });
        
        if (response.data.success) {
          onResults(response.data.data.results || []);
        }
      } else {
        // Navigate to search results page
        const searchParams = new URLSearchParams({
          q: query.trim(),
          type: contentType
        });

        if (filters.dateRange.start) searchParams.set('dateStart', filters.dateRange.start);
        if (filters.dateRange.end) searchParams.set('dateEnd', filters.dateRange.end);
        if (filters.tags.length > 0) searchParams.set('tags', filters.tags.join(','));
        if (filters.sortBy !== 'relevance') searchParams.set('sort', filters.sortBy);

        navigate(`/search?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Trigger search with the suggestion
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle tag toggle
  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      tags: [],
      sortBy: 'relevance'
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.tags.length > 0) count++;
    if (filters.sortBy !== 'relevance') count++;
    return count;
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              className="w-full pl-12 pr-12 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-800 placeholder-neutral-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              autoComplete="off"
            />
            
            {/* Loading/Submit Button */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              ) : (
                <button
                  type="submit"
                  className="text-primary-500 hover:text-primary-600 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle */}
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showAdvancedFilters || getActiveFilterCount() > 0
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </span>
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-neutral-100 dark:border-gray-700 last:border-b-0"
                >
                  {suggestion.contentType === 'tag' ? (
                    <Tag className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {suggestion.text}
                    </div>
                    {suggestion.contentType !== 'tag' && (
                      <div className="text-xs text-neutral-500 dark:text-gray-400 capitalize">
                        {suggestion.contentType}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-neutral-50 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700"
            >
              <div className="space-y-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                      className="px-3 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                      className="px-3 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableTags.slice(0, 20).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filters.tags.includes(tag)
                              ? 'bg-primary-100 text-primary-700 border border-primary-200'
                              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Newest First</option>
                    <option value="title">A-Z</option>
                  </select>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear Filters
                  </button>
                  <div className="text-xs text-neutral-500 dark:text-gray-400">
                    {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default UnifiedSearchBar;
