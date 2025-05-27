import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, ArrowRight, Calendar, Tag, Eye, Heart } from 'lucide-react';

const PiggeryList = ({ 
  piggeries = [], // Add default empty array
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit, 
  isLoading 
}) => {
  // Early return if piggeries is null or undefined
  if (!piggeries) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <PiggerySkeleton key={i} />)}
      </div>
    );
  }

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
  const PiggerySkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
    </div>
  );

  // Empty state
  if (piggeries.length === 0 && !isLoading) {
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
          className="w-12 h-12 mx-auto text-amber-700 dark:text-amber-500 mb-4"
        >
          <path d="M15.5 2H12a10 10 0 0 0 0 20h8a8 8 0 0 0 0-16" />
          <path d="M13 7a9 9 0 0 0-9 9" />
          <path d="M19 11v4" />
          <path d="M15 9v6" />
          <ellipse cx="9" cy="6" rx="2" ry="3" />
          <ellipse cx="19" cy="6" rx="2" ry="3" />
        </svg>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Piggery Information Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Check back later for piggery farming content.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <PiggerySkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {piggeries.map((piggery, index) => (
          <motion.article
            key={piggery._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {piggery.imageUrl && (
              <div className="relative overflow-hidden aspect-[16/9]">
                <img
                  src={`${apiBaseUrl}${piggery.imageUrl}`}
                  alt={piggery.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
                
                {piggery.breed && (
                  <span className="absolute top-4 left-4 bg-amber-700 text-white text-xs px-3 py-1 rounded-full">
                    <Tag className="inline w-3 h-3 mr-1" />{piggery.breed}
                  </span>
                )}
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(piggery.createdAt)}
              </div>
              
              <Link to={`/piggery/${piggery._id}`} className="group mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors">
                  {piggery.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">
                {truncateContent(piggery.content)}
              </p>
              
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{Math.floor(Math.random() * 1000)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{Math.floor(Math.random() * 50)}</span>
                </div>
                <Link
                  to={`/piggery/${piggery._id}`}
                  className="inline-flex items-center text-amber-700 dark:text-amber-500 hover:underline"
                >
                  Read More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              {isAdmin && (
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => onEdit(piggery._id)}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(piggery._id)}
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

export default PiggeryList;