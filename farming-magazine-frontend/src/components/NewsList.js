import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Eye, Share2 } from 'lucide-react';

const NewsList = ({ news, apiBaseUrl }) => {
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  if (news.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-300 mt-20">
        <p>No news articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((article, index) => (
        <motion.article
          key={article._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
        >
          {article.imageUrl && (
            <img
              src={`${apiBaseUrl}${article.imageUrl}`}
              alt={article.title}
              onError={handleImageError}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-5 flex flex-col h-full">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(article.createdAt)}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              <Link to={`/news/${article._id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {article.title}
              </Link>
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">
              {article.summary || 'No summary available.'}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4" /> {Math.floor(Math.random() * 800) + 200}
              </span>
              <Link
                to={`/news/${article._id}`}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Read More <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
};

export default NewsList;
