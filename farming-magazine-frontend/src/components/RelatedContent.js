import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, TrendingUp, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const RelatedContent = ({ currentContent, contentType, className = "" }) => {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRelatedContent = async () => {
      try {
        setLoading(true);
        
        // Get content from the same category/type
        const response = await axios.get(`${API_BASE_URL}/api/content/${contentType}?limit=6`);
        const allContent = response.data.data[contentType] || response.data.data.blogs || response.data.data.news || [];
        
        // Filter out current content and get related posts
        const related = allContent
          .filter(item => item._id !== currentContent._id)
          .slice(0, 3);
        
        setRelatedPosts(related);
        setError(null);
      } catch (err) {
        console.error('Error fetching related content:', err);
        setError('Failed to load related content');
      } finally {
        setLoading(false);
      }
    };

    if (currentContent && contentType) {
      fetchRelatedContent();
    }
  }, [currentContent, contentType, API_BASE_URL]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const estimateReadTime = (content) => {
    if (!content) return '5 min read';
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    return `${readTime} min read`;
  };

  const getContentUrl = (post) => {
    const typeMap = {
      'blogs': 'blogs',
      'news': 'news',
      'dairies': 'dairies',
      'beefs': 'beefs',
      'farms': 'farms',
      'piggeries': 'piggery',
      'goats': 'goats'
    };
    const urlType = typeMap[contentType] || contentType;
    return `/${urlType}/${post._id}`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Related Articles</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || relatedPosts.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Related Articles</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          More content you might find interesting
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {relatedPosts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group"
          >
            <Link 
              to={getContentUrl(post)}
              className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 -m-3 transition-colors duration-200"
            >
              <div className="flex items-start space-x-3">
                {post.imageUrl && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={`${API_BASE_URL}${post.imageUrl}`}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h4>
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(post.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {estimateReadTime(post.content)}
                    </div>
                  </div>
                  
                  {post.category && (
                    <div className="mt-1 flex items-center">
                      <Tag className="w-3 h-3 mr-1 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>
                
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
        <Link 
          to={`/${contentType}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          View all {contentType}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default RelatedContent;
