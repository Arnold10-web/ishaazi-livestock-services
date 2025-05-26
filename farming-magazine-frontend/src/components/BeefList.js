import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, ArrowRight, Calendar, Clock, Tag, Heart, Eye, MessageCircle, Beef, Scale, Award } from 'lucide-react';


const BeefList = ({ beefs, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading }) => {
  // Utility function to handle image load errors
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  // Utility function to truncate HTML content
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Utility function to format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Skeleton loader for beef items with shimmer effect
  const BeefSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg" />
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/4" />
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/5" />
          </div>
          <div className="h-7 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4" />
          <div className="space-y-2 mt-3">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-4/6" />
          </div>
          <div className="flex justify-between mt-4">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/3" />
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/4" />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-gray-600/60 to-transparent" />
    </div>
  );

  // Empty state with animation when no beef data is available
  if (beefs.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="p-4 rounded-full bg-red-50 dark:bg-red-900/20"
        >
          <Beef className="w-16 h-16 text-red-500 dark:text-red-400" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">No Beef Information Found</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">We're working on adding new beef farming content. Check back soon for informative articles!</p>
        <motion.div 
          className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p>💡 Subscribe to our newsletter to get notified when new beef content is published.</p>
        </motion.div>
      </motion.div>
    );
  }

  // Loading state with a skeleton grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((i) => (
          <BeefSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {beefs.map((beef, index) => (
            <motion.article
              key={beef._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
            >
              {beef.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <motion.img
                    src={`${apiBaseUrl}${beef.imageUrl}`}
                    alt={beef.title}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category badge */}
                  {beef.cutType && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 backdrop-blur-sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {beef.cutType}
                      </span>
                    </div>
                  )}
                  
                  {/* Reading time badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.ceil((beef.content?.length || 0) / 1000)} min read
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  <time>{formatDate(beef.createdAt)}</time>
                </div>
                
                <Link 
                  to={`/beef/${beef._id}`}
                  className="block group/title mb-3"
                >
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white group-hover/title:text-red-600 dark:group-hover/title:text-red-400 transition-colors duration-200">
                    {beef.title}
                  </h2>
                </Link>
                
                <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-3 text-sm flex-grow">
                  {truncateContent(beef.content)}
                </p>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center">
                      <Eye className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                      {Math.floor(Math.random() * 1000)}
                    </span>
                    <span className="inline-flex items-center">
                      <Scale className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                      {Math.floor(Math.random() * 500) + 'kg'}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/beef/${beef._id}`}
                    className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium group/link hover:underline"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </div>
                {isAdmin && (
                  <div className="mt-4 flex gap-2 px-6 pb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(beef._id)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-300 dark:hover:text-blue-400 rounded-full transition-colors duration-200"
                      aria-label="Edit beef"
                    >
                      <Edit2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(beef._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-gray-300 dark:hover:text-red-400 rounded-full transition-colors duration-200"
                      aria-label="Delete beef"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BeefList;
