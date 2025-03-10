import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Edit2, Trash2, ExternalLink } from 'lucide-react';

const NewsList = ({ news, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    text = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    return text;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(-diffDays, 'day');
    }

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
        {news.length > 0 ? (
          news.map((newsItem) => (
            <motion.article
              key={newsItem._id}
              variants={itemVariants}
              layout
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {newsItem.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`${apiBaseUrl}${newsItem.imageUrl}`}
                    alt={newsItem.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(newsItem.createdAt)}
                  </span>
                  {newsItem.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {newsItem.readTime} min read
                    </span>
                  )}
                </div>

                <Link 
                  to={`/news/${newsItem._id}`}
                  className="group block"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                    {newsItem.title}
                  </h2>
                </Link>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {truncateContent(newsItem.content)}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <Link
                    to={`/news/${newsItem._id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Read More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(newsItem._id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                        aria-label="Edit news"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(newsItem._id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                        aria-label="Delete news"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
            <p className="text-xl text-gray-600">
              No news available at the moment. Check back soon!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NewsList;