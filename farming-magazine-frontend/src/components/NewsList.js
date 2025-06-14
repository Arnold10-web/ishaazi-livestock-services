/**
 * NewsList Component
 * 
 * Renders a responsive grid of news articles with animations, hover effects,
 * and clean typography. Features include breaking news indicators, loading skeletons,
 * and empty states when no news articles are available.
 * 
 * @module components/NewsList
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Newspaper, Clock
} from 'lucide-react';

/**
 * Renders a grid of news articles with animations and interactive elements
 * 
 * @param {Object} props - Component props
 * @param {Array} props.news - Array of news article objects to display
 * @param {string} props.apiBaseUrl - Base URL for API requests (used for image paths)
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @returns {JSX.Element} Rendered news list component
 */
const NewsList = ({ news, apiBaseUrl, isLoading }) => {
  /**
   * Handles image loading errors by replacing with default placeholder
   * @param {Event} e - Image error event
   */
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  /**
   * Formats date strings into abbreviated, localized format
   * @param {string} date - ISO date string to format
   * @returns {string} Formatted date string (e.g., "Jan 1, 2023")
   */
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  /**
   * Truncates content to specified length with ellipsis
   * @param {string} content - Content text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text with ellipsis if needed
   */
  const truncateContent = (content, maxLength = 120) => {
    if (!content) return 'No summary available.';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  /**
   * Skeleton loader component for news articles during loading state
   * Creates a placeholder UI with pulsing animation for better UX
   * @returns {JSX.Element} Animated skeleton loader
   */
  const NewsSkeleton = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Image placeholder */}
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="p-6 space-y-4">
        {/* Meta information placeholders */}
        <div className="flex items-center space-x-3">
          <div className="h-3 bg-gray-200 rounded-full w-20 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded-full w-16 animate-pulse" />
        </div>
        {/* Title placeholder */}
        <div className="h-6 bg-gray-200 rounded w-4/5 animate-pulse" />
        {/* Content placeholders */}
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        {/* Action button placeholders */}
        <div className="flex justify-between items-center pt-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <NewsSkeleton key={i} />)}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-24 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Newspaper className="w-12 h-12 text-white" />
        </div>
        
        <div className="space-y-3">
          <h3 className="text-3xl font-serif font-bold text-gray-900">
            No News Articles Found
          </h3>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Stay tuned for the latest agricultural news and market updates!
          </p>
        </div>
      </motion.div>
    );
  }  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {news.map((article, index) => (
          <motion.article
            key={article._id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Image Section */}
            <div className="relative overflow-hidden">
              {article.imageUrl && (
                <img
                  src={`${apiBaseUrl}${article.imageUrl}`}
                  alt={article.title}
                  onError={handleImageError}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              
              {/* Clean typography overlay instead of tags */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">
                  {article.title}
                </h3>
              </div>
              
              {/* Simple breaking news indicator */}
              {article.isBreaking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 left-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                />
              )}
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Meta information */}
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(article.createdAt)}
                </span>
                {article.author && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{article.author}</span>
                  </>
                )}
                <span className="ml-auto flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.ceil((article.content?.length || 0) / 200)} min
                </span>
              </div>
              
              {/* Content preview */}
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {truncateContent(article.summary)}
              </p>

              {/* Clean elegant button */}
              <Link
                to={`/news/${article._id}`}
                className="inline-block text-green-700 font-medium text-sm uppercase tracking-wide hover:text-green-800 transition-colors border-b border-green-700 hover:border-green-800 pb-1"
              >
                Read Article →
              </Link>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NewsList;
