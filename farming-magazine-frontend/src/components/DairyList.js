import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, ArrowRight, Calendar, Clock, Milk, Tag, Heart, Eye, MessageCircle, BarChart2 } from 'lucide-react';


const DairyList = ({ dairies, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading }) => {
  // Utility: Handle image load errors
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg'; // Fallback image
  };

  // Utility: Truncate HTML content
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Utility: Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Skeleton loader with shimmer effect for loading state
  const DairySkeleton = () => (
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

  // Empty state with animated icon when no dairies exist
  if (dairies.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20"
        >
          <Milk className="w-16 h-16 text-blue-500 dark:text-blue-400" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">No Dairy Information Found</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">We're working on adding new dairy farming content. Check back soon for informative articles!</p>
        <motion.div 
          className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 text-sm"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p>💡 Subscribe to our newsletter to get notified when new dairy content is published.</p>
        </motion.div>
      </motion.div>
    );
  }

  // Loading state: Display a grid of skeleton loaders
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((i) => (
          <DairySkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {dairies.map((dairy, index) => (
            <motion.article
              key={dairy._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
            >
              {dairy.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <motion.img
                    src={`${apiBaseUrl}${dairy.imageUrl}`}
                    alt={dairy.title}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category badge */}
                  {dairy.category && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 backdrop-blur-sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {dairy.category}
                      </span>
                    </div>
                  )}
                  
                  {/* Reading time badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.ceil((dairy.content?.length || 0) / 1000)} min read
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  <time>{formatDate(dairy.createdAt)}</time>
                </div>
                
                <Link 
                  to={`/dairy/${dairy._id}`}
                  className="block group/title mb-3"
                >
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors duration-200">
                    {dairy.title}
                  </h2>
                </Link>
                
                <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-3 text-sm flex-grow">
                  {truncateContent(dairy.content)}
                </p>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center">
                      <Eye className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                      {Math.floor(Math.random() * 1000)}
                    </span>
                    <span className="inline-flex items-center">
                      <Heart className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                      {Math.floor(Math.random() * 50)}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/dairy/${dairy._id}`}
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium group/link hover:underline"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </div>
                {isAdmin && (
                  <div className="admin-actions mt-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(dairy._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50"
                      aria-label="Edit dairy"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(dairy._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                      aria-label="Delete dairy"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default DairyList;
