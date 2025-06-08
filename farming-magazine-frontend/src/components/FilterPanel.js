// FilterPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterPanel = ({ contentType, onFilterChange, initialFilters = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    categories: initialFilters.categories || [],
    tags: initialFilters.tags || [],
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    sortBy: initialFilters.sortBy || 'createdAt',
    sortOrder: initialFilters.sortOrder || 'desc'
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch categories and tags when content type changes
  useEffect(() => {
    if (!contentType) return;
    
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesResponse = await axios.get(`${API_BASE_URL}/api/search/categories/${contentType}`);
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        }
        
        // Fetch tags if applicable
        if (['blog', 'news', 'dairy', 'beef', 'goat', 'piggery'].includes(contentType)) {
          const tagsResponse = await axios.get(`${API_BASE_URL}/api/search/tags/${contentType}`);
          if (tagsResponse.data.success) {
            setTags(tagsResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilterOptions();
  }, [contentType, API_BASE_URL]);

  // Apply filters when they change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const updatedFilters = { 
        ...prev,
        [filterName]: value 
      };
      
      // Notify parent component about filter changes
      onFilterChange(updatedFilters);
      
      return updatedFilters;
    });
  };

  // Handle category toggle
  const toggleCategory = (category) => {
    const updatedCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    handleFilterChange('categories', updatedCategories);
  };

  // Handle tag toggle
  const toggleTag = (tag) => {
    const updatedTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    handleFilterChange('tags', updatedTags);
  };

  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
      categories: [],
      tags: [],
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <Filter size={18} className="mr-2" />
          <span>Filters</span>
          {(filters.categories.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo) && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              Active
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {loading ? (
                <div className="flex justify-center py-4">
                  <span className="text-gray-500">Loading filters...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              filters.categories.includes(category)
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 20).map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              filters.tags.includes(tag)
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Sort By</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="createdAt">Date</option>
                        <option value="title">Title</option>
                        <option value="views">Views</option>
                        <option value="likes">Likes</option>
                      </select>
                      
                      <select
                        value={filters.sortOrder}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    >
                      <X size={16} className="mr-1" />
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;
