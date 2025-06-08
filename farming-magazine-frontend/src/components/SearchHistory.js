// Search history and saved searches component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Star, 
  X, 
  Search, 
  Trash2, 
  Download,
  Share2,
  BookOpen
} from 'lucide-react';

const SearchHistory = ({ onSearchClick, isVisible, onClose }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeTab, setActiveTab] = useState('history');

  // Load data from localStorage on component mount
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    setSearchHistory(history.slice(0, 20)); // Keep only last 20 searches
    setSavedSearches(saved);
  }, []);

  // Add search to history (called from parent component)
  // eslint-disable-next-line no-unused-vars
  const addToHistory = (searchTerm, filters = {}) => {
    const newEntry = {
      id: Date.now(),
      searchTerm,
      filters,
      timestamp: new Date().toISOString(),
      resultCount: 0 // Will be updated when results are received
    };

    const updatedHistory = [newEntry, ...searchHistory.filter(item => 
      item.searchTerm.toLowerCase() !== searchTerm.toLowerCase()
    )].slice(0, 20);

    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Save a search
  const saveSearch = (searchItem) => {
    const savedItem = {
      ...searchItem,
      id: Date.now(),
      savedAt: new Date().toISOString(),
      name: `Search: ${searchItem.searchTerm}`
    };

    const updatedSaved = [savedItem, ...savedSearches];
    setSavedSearches(updatedSaved);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSaved));
  };

  // Remove from history
  const removeFromHistory = (id) => {
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Remove saved search
  const removeSavedSearch = (id) => {
    const updatedSaved = savedSearches.filter(item => item.id !== id);
    setSavedSearches(updatedSaved);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSaved));
  };

  // Clear all history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Export search history
  const exportHistory = () => {
    const data = {
      searchHistory,
      savedSearches,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share search
  const shareSearch = async (searchItem) => {
    const url = `${window.location.origin}/search?q=${encodeURIComponent(searchItem.searchTerm)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Search: ${searchItem.searchTerm}`,
          url: url
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        alert('Search URL copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Search URL copied to clipboard!');
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  // Handle search click
  const handleSearchClick = (searchItem) => {
    onSearchClick(searchItem.searchTerm, searchItem.filters);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search Library
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportHistory}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Export search data"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline-block mr-2" />
            Recent Searches ({searchHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'saved'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4 inline-block mr-2" />
            Saved Searches ({savedSearches.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {searchHistory.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Your recent searches
                      </span>
                      <button
                        onClick={clearHistory}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Clear all
                      </button>
                    </div>
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSearchClick(item)}
                        >
                          <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.searchTerm}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatRelativeTime(item.timestamp)}
                            {item.resultCount > 0 && ` • ${item.resultCount} results`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => saveSearch(item)}
                            className="p-1 text-gray-400 hover:text-yellow-500"
                            title="Save this search"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => shareSearch(item)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                            title="Share this search"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromHistory(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Remove from history"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No recent searches</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Your search history will appear here
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="saved"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {savedSearches.length > 0 ? (
                  savedSearches.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSearchClick(item)}
                      >
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.searchTerm}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Saved {formatRelativeTime(item.savedAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => shareSearch(item)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="Share this search"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSavedSearch(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No saved searches</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Save searches from your history to keep them handy
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchHistory;
