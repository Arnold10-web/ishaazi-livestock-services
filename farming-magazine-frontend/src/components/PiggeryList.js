import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, ArrowRight } from 'lucide-react';


const PiggeryList = ({ 
  piggeries, 
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit, 
  isLoading 
}) => {
  // Handle image load errors and use a fallback placeholder
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  // Truncate HTML content to a specified maximum length
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Format a date string into a human-readable date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Skeleton loader with a shimmer effect for the loading state
  const PiggerySkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-sm p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
        </div>
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );

  // If the list is loading, render a grid of skeleton loaders
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((i) => (
          <PiggerySkeleton key={i} />
        ))}
      </div>
    );
  }

  // If there are no piggery items and not loading, show an animated empty state
  if (piggeries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          <AlertCircle className="w-16 h-16 text-blue-400/80" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-semibold text-gray-800">No Piggeries Found</h3>
        <p className="mt-2 text-gray-600">Check back soon for updates!</p>
      </motion.div>
    );
  }

  // Render the piggery items in a responsive grid with animations
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {piggeries.map((piggery, index) => (
            <motion.article
              key={piggery._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden piggery-item"
            >
              {piggery.imageUrl && (
                <div className="piggery-image-container relative">
                  <motion.img
                    src={`${apiBaseUrl}${piggery.imageUrl}`}
                    alt={piggery.title}
                    className="piggery-image w-full object-cover"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <div className="piggery-content p-6">
                <Link to={`/piggery/${piggery._id}`} className="piggery-link block">
                  <h2 className="piggery-title text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    {piggery.title}
                  </h2>
                </Link>
                <p className="piggery-date text-sm text-gray-500 mt-1">
                  {formatDate(piggery.createdAt)}
                </p>
                <p className="piggery-excerpt text-gray-600 mt-3">
                  {truncateContent(piggery.content)}
                </p>
                <Link to={`/piggery/${piggery._id}`} className="read-more inline-flex items-center gap-1 text-blue-600 font-medium mt-4">
                  Read More
                  <ArrowRight className="w-4 h-4 transition-transform duration-300" />
                </Link>
                {isAdmin && (
                  <div className="admin-actions mt-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(piggery._id)}
                      className="update-btn p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                      aria-label="Edit piggery"
                    >
                      <Edit2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(piggery._id)}
                      className="delete-btn p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                      aria-label="Delete piggery"
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

export default PiggeryList;
