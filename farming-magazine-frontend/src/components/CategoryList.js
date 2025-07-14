// CategoryList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Loader2 } from 'lucide-react';

const CategoryList = ({ contentType, onCategorySelect, activeCategory = null }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Fetching categories for content type:', contentType);
        console.log('API URL:', `${API_BASE_URL}/api/search/categories/${contentType}`);
        
        const response = await axios.get(`${API_BASE_URL}/api/search/categories/${contentType}`);
        
        console.log('Categories API response:', response.data);
        
        if (response.data.success) {
          setCategories(response.data.data);
          setError(null);
        } else {
          console.error('API returned error:', response.data);
          setError('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        console.error('Error details:', err.response?.data || 'No response data');
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [contentType, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400 py-2">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Categories</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategorySelect(null)}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            activeCategory === null
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center ${
              activeCategory === category
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Tag className="w-3 h-3 mr-1.5" />
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
