/**
 * SearchFilters Component
 * 
 * Advanced search filtering interface that provides options for refining
 * search results by date range, tags, minimum views, and sorting order.
 * Features include animated transitions, tag selection, and filter persistence.
 * 
 * @module components/SearchFilters
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Filter, 
  Hash, 
  ChevronDown,
  Eye
} from 'lucide-react';

/**
 * Advanced search filters component with multiple filtering options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter settings
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {Array} props.availableTags - Available content tags for filtering
 * @param {Object} props.contentTypeCounts - Count of content by type
 * @param {boolean} props.isVisible - Whether filters are visible
 * @param {Function} props.onToggle - Callback to toggle filters visibility
 * @returns {JSX.Element} Rendered search filters component
 */
const SearchFilters = ({ 
  filters, 
  onFiltersChange, 
  availableTags = [], 
  contentTypeCounts = {},
  isVisible = true,
  onToggle
}) => {
  // Local state for filter values before applying
  const [localFilters, setLocalFilters] = useState({
    dateRange: { start: '', end: '' },
    tags: [],
    minViews: '',
    sortBy: 'relevance',
    ...filters
  });

  // UI state for tag selector dropdown
  const [showTagSelector, setShowTagSelector] = useState(false);

  /**
   * Synchronize local filter state with parent component filters
   */
  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  /**
   * Apply locally modified filters by calling parent callback
   */
  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  /**
   * Reset all filters to default values and notify parent
   */
  const resetFilters = () => {
    const resetFilters = {
      dateRange: { start: '', end: '' },
      tags: [],
      minViews: '',
      sortBy: 'relevance'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...localFilters.dateRange, [field]: value };
    setLocalFilters(prev => ({ ...prev, dateRange: newDateRange }));
  };

  // Handle tag selection
  const handleTagToggle = (tag) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter(t => t !== tag)
      : [...localFilters.tags, tag];
    setLocalFilters(prev => ({ ...prev, tags: newTags }));
  };

  // Handle other filter changes
  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.dateRange.start || localFilters.dateRange.end) count++;
    if (localFilters.tags.length > 0) count++;
    if (localFilters.minViews) count++;
    if (localFilters.sortBy !== 'relevance') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <Filter className="w-4 h-4 mr-1" />
        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Search Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date Range
        </label>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="date"
              value={localFilters.dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <div className="relative">
            <input
              type="date"
              value={localFilters.dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span className="flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                {localFilters.tags.length > 0 
                  ? `${localFilters.tags.length} tag${localFilters.tags.length !== 1 ? 's' : ''} selected`
                  : 'Select tags'
                }
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showTagSelector ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showTagSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {availableTags.map(tag => (
                    <label
                      key={tag}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{tag}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Selected tags display */}
          {localFilters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localFilters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Minimum Views Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Views
        </label>
        <div className="relative">
          <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            value={localFilters.minViews}
            onChange={(e) => handleFilterChange('minViews', e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 100"
            min="0"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort By
        </label>
        <select
          value={localFilters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance">Relevance</option>
          <option value="date">Newest First</option>
          <option value="title">Alphabetical</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          disabled={activeFilterCount === 0}
        >
          Reset All
        </button>
        <button
          onClick={applyFilters}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </motion.div>
  );
};

export default SearchFilters;
