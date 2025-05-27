import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, ArrowRight, Calendar, Tag, Eye, Heart } from 'lucide-react';

const GoatList = ({ goats, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading }) => {
  // Utility function for image error handling
  const handleImageError = (e) => {
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
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Simple skeleton loader component
  const GoatSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
    </div>
  );

  // Empty state
  if (goats.length === 0 && !isLoading) {
    return (
      <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-4"
        >
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Goat Information Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Check back later for goat farming content.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <GoatSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {goats.map((goat, index) => (
          <motion.article
            key={goat._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {goat.imageUrl && (
              <div className="relative overflow-hidden aspect-[16/9]">
                <img
                  src={`${apiBaseUrl}${goat.imageUrl}`}
                  alt={goat.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
                
                {goat.breed && (
                  <span className="absolute top-4 left-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                    <Tag className="inline w-3 h-3 mr-1" />{goat.breed}
                  </span>
                )}
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(goat.createdAt)}
              </div>
              
              <Link to={`/goat/${goat._id}`} className="group mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {goat.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">
                {truncateContent(goat.content)}
              </p>
              
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{Math.floor(Math.random() * 1000)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{Math.floor(Math.random() * 50)}</span>
                </div>
                <Link
                  to={`/goat/${goat._id}`}
                  className="inline-flex items-center text-green-600 dark:text-green-400 hover:underline"
                >
                  Read More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              {isAdmin && (
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => onEdit(goat._id)}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(goat._id)}
                    className="p-2 rounded-full text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GoatList;
