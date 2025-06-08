// Enhanced SearchBar.js with autocomplete, suggestions, and search history
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Clock, TrendingUp, Hash, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchHistory from './SearchHistory';

const SearchBar = ({ placeholder = "Search all content...", expandable = false }) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(!expandable);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Debounced function to fetch suggestions
  const debouncedFetchSuggestions = useCallback((searchQuery) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/search/suggestions?query=${encodeURIComponent(searchQuery)}&limit=8`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuggestions(data.data.suggestions || []);
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    }, 300);
  }, [API_BASE_URL]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveSuggestionIndex(-1);
    debouncedFetchSuggestions(value);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to collapse expandable search and suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        if (expandable) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandable]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          e.preventDefault();
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        // Do nothing for other keys
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    
    // Track analytics
    trackSearchAnalytics(suggestion.text, 'suggestion_click');
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
  };

  // Track search analytics
  const trackSearchAnalytics = async (searchTerm, action = 'search') => {
    try {
      await fetch(`${API_BASE_URL}/api/search/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          action,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error tracking search analytics:', error);
    }
  };

  // Add search to history
  const addToSearchHistory = (searchTerm, filters = {}) => {
    const newEntry = {
      id: Date.now(),
      searchTerm,
      filters,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const updatedHistory = [
      newEntry,
      ...existingHistory.filter(item => 
        item.searchTerm.toLowerCase() !== searchTerm.toLowerCase()
      )
    ].slice(0, 20); // Keep only last 20 searches

    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Handle search from history
  const handleHistorySearch = (searchTerm, filters = {}) => {
    setQuery(searchTerm);
    trackSearchAnalytics(searchTerm, 'history_search');
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    
    const searchTerm = query.trim();
    
    // Add to search history
    addToSearchHistory(searchTerm);
    
    // Track search analytics
    trackSearchAnalytics(searchTerm, 'manual_search');
    
    // Navigate to search results page with query parameter
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    
    // Reset loading state after navigation
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'tag':
        return <Hash className="h-4 w-4 text-blue-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  if (expandable && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-gray-700 hover:text-orange-500 focus:outline-none p-2 rounded-full transition-colors"
        aria-label="Open search"
      >
        <Search size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      <form 
        onSubmit={handleSubmit}
        className={`relative flex items-center transition-all duration-300 ${
          expandable ? 'w-full md:w-80' : 'w-full'
        }`}
      >
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            autoFocus={expandable}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
            autoComplete="off"
          />
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={handleClear}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Loader2 size={18} className="text-blue-500" />
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 focus:outline-none p-1"
                aria-label="Submit search"
              >
                <Search size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Search History Button */}
        <button
          type="button"
          onClick={() => setShowSearchHistory(true)}
          className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full transition-colors"
          title="Search History"
        >
          <BookOpen size={18} />
        </button>
      </form>

      {/* Search History Modal */}
      <SearchHistory
        onSearchClick={handleHistorySearch}
        isVisible={showSearchHistory}
        onClose={() => setShowSearchHistory(false)}
      />

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion.text}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  index === activeSuggestionIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.text}</div>
                  {suggestion.contentType && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {suggestion.contentType}
                    </div>
                  )}
                </div>
                {suggestion.type === 'popular' && suggestion.searchCount && (
                  <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {suggestion.searchCount}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
