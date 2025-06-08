// TagCloud.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Hash, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TagCloud = ({ contentType, onTagSelect, selectedTags = [], limit = 20 }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Ensure protocol is included in base URL
  // Make sure we use http:// protocol for the URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        console.log('Fetching tags for content type:', contentType);
        console.log('API URL:', `${API_BASE_URL}/api/search/tags/${contentType}`);
        
        const response = await axios.get(`${API_BASE_URL}/api/search/tags/${contentType}`);
        
        console.log('Tags API response:', response.data);
        
        if (response.data.success) {
          // Sort tags alphabetically for better UI presentation
          const sortedTags = response.data.data ? 
            [...response.data.data].sort() : 
            [];
          
          setTags(sortedTags);
          setError(null);
          
          // Log if tags array is empty
          if (!sortedTags.length) {
            console.log(`No tags found for content type: ${contentType}`);
          } else {
            console.log(`Retrieved ${sortedTags.length} tags for ${contentType}`);
          }
        } else {
          console.error('API returned error:', response.data);
          setError('Failed to fetch tags');
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
        console.error('Error details:', err.response?.data || 'No response data');
        setError('Failed to load tags');
      } finally {
        setLoading(false);
      }
    };

    if (['blog', 'news', 'dairy', 'beef', 'goat', 'piggery'].includes(contentType)) {
      fetchTags();
    } else {
      setLoading(false);
      setError('Content type does not support tags');
    }
  }, [contentType, API_BASE_URL]);

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter(t => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onTagSelect([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading tags...</span>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // If no tags are available, don't render anything
  if (tags.length === 0) {
    return null;
  }

  // For display, either show all tags or limit to the specified number
  const displayTags = showAll ? tags : tags.slice(0, limit);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Popular Tags</h2>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, index) => (
          <motion.button
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleTagToggle(tag)}
            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center ${
              selectedTags.includes(tag)
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Hash className="w-3 h-3 mr-1" />
            {tag}
          </motion.button>
        ))}
        
        {tags.length > limit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
          >
            {showAll ? 'Show Less' : `+${tags.length - limit} More`}
          </button>
        )}
      </div>
    </div>
  );
};

export default TagCloud;
