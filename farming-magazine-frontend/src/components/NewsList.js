import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Edit2, Trash2, Bookmark, Share2 } from 'lucide-react';

const NewsList = ({ news, apiBaseUrl, isAdmin, onDelete, onEdit, searchTerm = '' }) => {
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
    e.target.onerror = null;
  };

  // Filter news based on search term
  const filteredNews = news.filter(newsItem => {
    return newsItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           newsItem.content?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
    >
      <AnimatePresence mode="wait">
        {filteredNews.length > 0 ? (
          filteredNews.map((newsItem) => (
            <motion.article
              key={newsItem._id}
              variants={itemVariants}
              layout
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {newsItem.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`${apiBaseUrl}${newsItem.imageUrl}`}
                    alt={newsItem.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {newsItem.category && (
                    <span className="absolute top-4 left-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-3 py-1 rounded-full text-xs font-medium">
                      {newsItem.category}
                    </span>
                  )}
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(newsItem.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {newsItem.readTime || '1'} min read
                  </span>
                </div>

                <Link to={`/news/${newsItem._id}`} className="group block">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {newsItem.title}
                  </h2>
                </Link>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {newsItem.summary || newsItem.content.substring(0, 150) + '...'}
                </p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    to={`/news/${newsItem._id}`}
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                  >
                    Read More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>

                  <div className="flex items-center gap-3">
                    <button className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onEdit(newsItem._id)}
                          className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          aria-label="Edit news"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(newsItem._id)}
                          className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label="Delete news"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="col-span-full text-center py-12"
          >
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'No matching articles found' 
                : 'No news available at the moment. Check back soon!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NewsList;