/**
 * BlogList Component
 * 
 * Renders a responsive grid of blog entries with animations and interactive UI elements.
 * Features include animated transitions, glassmorphism effects, hover interactions,
 * loading skeletons, empty states, and optional admin controls.
 * 
 * @module components/BlogList
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Eye, Heart, ArrowRight, Edit2, Trash2, BookOpen
} from 'lucide-react';
import { useEngagement } from '../hooks/useEngagement';

/**
 * Renders a list of blog articles with various interactive UI elements
 * 
 * @param {Object} props - Component props
 * @param {Array} props.blogs - Array of blog objects to display
 * @param {string} props.apiBaseUrl - Base URL for API requests (used for image paths)
 * @param {boolean} props.isAdmin - Whether admin controls should be displayed
 * @param {Function} props.onDelete - Callback function when delete button is clicked
 * @param {Function} props.onEdit - Callback function when edit button is clicked
 * @param {boolean} props.isLoading - Whether the component is in loading state
 * @param {string} props.viewMode - Display mode ('grid' or 'list')
 * @returns {JSX.Element} Rendered blog list component
 */
const BlogList = ({ blogs, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading, viewMode = 'grid' }) => {
  /**
   * Individual blog item component with per-item engagement functionality
   */
  const BlogItem = React.memo(({ blog, index }) => {
    // Per-item engagement hook - no view tracking to prevent false counts
    const { stats, toggleLike, loading: engagementLoading } = useEngagement('blogs', blog._id, { trackViews: false });
    const [isLiked, setIsLiked] = useState(stats.isLiked || false);

    // Update isLiked state when stats change
    React.useEffect(() => {
      setIsLiked(stats.isLiked || false);
    }, [stats.isLiked]);

    const handleLike = useCallback(async () => {
      if (isAdmin || engagementLoading) return; // Don't allow likes in admin view
      
      try {
        const newLikedState = await toggleLike(isLiked);
        setIsLiked(newLikedState);
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    }, [engagementLoading, toggleLike, isLiked]);

    return (
      <motion.article
        key={blog._id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ 
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{ 
          y: viewMode === 'list' ? -4 : -8,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        className={`group relative backdrop-blur-md bg-white/10 border border-white/20 
                   shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden
                   before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-100/20 before:to-purple-100/20 
                   before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                   ${viewMode === 'list' 
                     ? 'flex rounded-3xl' 
                     : 'flex flex-col rounded-3xl'
                   }`}
      >
        {/* Image container */}
        <div className={`relative overflow-hidden ${
          viewMode === 'list' 
            ? 'w-64 lg:w-80 flex-shrink-0 aspect-[4/3] rounded-l-3xl' 
            : 'aspect-[16/10] rounded-t-3xl'
        }`}>
          {blog.imageUrl && (
            <motion.img
              src={`${apiBaseUrl}${blog.imageUrl}`}
              alt={blog.title}
              onError={handleImageError}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
          
          {/* Enhanced overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category badge */}
          {blog.category && (
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4 backdrop-blur-md bg-blue-500/90 text-white text-xs font-semibold 
                         px-3 py-2 rounded-full border border-white/20 shadow-lg
                         flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3" />
              {blog.category}
            </motion.span>
          )}
        </div>
        
        {/* Enhanced content section */}
        <div className={`p-6 flex-1 flex flex-col relative z-20 ${viewMode === 'list' ? 'justify-between' : ''}`}>
          {/* Meta information */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between text-xs text-blue-600/70 mb-3"
          >
            <div className="flex items-center gap-2 backdrop-blur-sm bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-200/30">
              <Calendar className="w-3 h-3" />
              {formatDate(blog.createdAt)}
            </div>
          </motion.div>
          
          {/* Enhanced title */}
          <Link to={`/blog/${blog._id}`} className="group/title mb-3 block">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent
                         group-hover/title:from-blue-600 group-hover/title:to-purple-600 transition-all duration-300
                         leading-tight line-clamp-2"
            >
              {blog.title}
            </motion.h2>
          </Link>
          
          {/* Enhanced content preview */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600/80 text-sm leading-relaxed flex-grow line-clamp-3 mb-4"
          >
            {truncateContent(blog.content)}
          </motion.p>

          {/* Enhanced stats and interaction section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center pt-4 border-t border-blue-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-blue-600/70 text-sm">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{blog.views || 0}</span>
              </div>
              
              {/* Like section - different behavior for admin vs public */}
              {isAdmin ? (
                // Admin view: display-only likes count
                <div className="flex items-center gap-1.5 text-purple-600/70 text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">{stats.likes || blog.likes || 0}</span>
                </div>
              ) : (
                // Public view: interactive like button
                <motion.button
                  onClick={handleLike}
                  disabled={engagementLoading}
                  className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
                    isLiked 
                      ? 'text-red-600' 
                      : 'text-purple-600/70 hover:text-purple-600'
                  } ${engagementLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={engagementLoading ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <span className="font-medium">{stats.likes || blog.likes || 0}</span>
                </motion.button>
              )}
            </div>
            
            <Link
              to={`/blog/${blog._id}`}
              className="group/link inline-flex items-center gap-2 text-blue-600 hover:text-purple-600 
                         font-semibold text-sm transition-all duration-300
                         hover:gap-3 relative"
            >
              <span>Read More</span>
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
          
          {/* Enhanced admin controls */}
          {isAdmin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 flex gap-2 justify-end pt-3 border-t border-blue-100/50"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(blog._id)}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-blue-50/80 border border-blue-200/50
                           text-blue-600 hover:bg-blue-100/80 hover:text-blue-700 
                           transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(blog._id)}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-red-50/80 border border-red-200/50
                           text-red-600 hover:bg-red-100/80 hover:text-red-700 
                           transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.article>
    );
  });
  /**
   * Handles image loading errors by replacing with default placeholder
   * @param {Event} e - Image error event
   */
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  /**
   * Truncates HTML content to specified length while preserving plain text
   * @param {string} content - HTML content to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated plain text with ellipsis if needed
   */
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  /**
   * Formats date strings into localized, human-readable format
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date string (e.g., "January 1, 2023")
   */
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  /**
   * Skeleton loader component for blog cards during loading state
   * Implements animated placeholder UI with glassmorphism effects
   * @returns {JSX.Element} Animated skeleton loader
   */
  const BlogSkeleton = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-16 h-16 bg-blue-500/10 rounded-full animate-pulse" />
        <div className="absolute bottom-8 left-6 w-8 h-8 bg-green-500/10 rounded-full animate-bounce" />
      </div>
      
      <div className="relative p-8 space-y-6">
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-2xl animate-pulse backdrop-blur-sm border border-white/10" />
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-xl animate-pulse w-4/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-3/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-full" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-5/6" />
        </div>
      </div>
    </motion.div>
  );

  if (blogs.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center py-24 px-12"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-500/20 rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.random() * 400,
                y: Math.random() * 300,
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-3">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              No Blogs Available
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto"
            >
              We're working on bringing you amazing agricultural content. Please check back soon!
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center space-x-2"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <BlogSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {blogs.map((blog, index) => (
          <BlogItem key={blog._id} blog={blog} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BlogList;
