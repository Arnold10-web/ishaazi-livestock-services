import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Edit2, Trash2, Bookmark, Share2, Tag, Eye, MessageCircle, Newspaper } from 'lucide-react';

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
  
  // Split news into featured and regular articles
  const featuredArticles = filteredNews.slice(0, 1);
  const regularArticles = filteredNews.slice(1);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check if article is new (published within the last 3 days)
  const isNewArticle = (dateString) => {
    const publishDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - publishDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
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
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.3
      }
    }
  };
  
  const hoverVariants = {
    hover: {
      scale: 1.01,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {filteredNews.length > 0 ? (
        <div className="space-y-10 max-w-7xl mx-auto">
          {/* Featured Article Section */}
          {featuredArticles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 inline-flex items-center">
                <span className="relative">
                  Featured Story
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-blue-500 rounded-full"></span>
                </span>
              </h2>
              
              <motion.article 
                whileHover="hover"
                variants={hoverVariants}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden group relative"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-full overflow-hidden">
                    <img
                      src={`${apiBaseUrl}${featuredArticles[0].imageUrl}`}
                      alt={featuredArticles[0].title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={handleImageError}
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {featuredArticles[0].category && (
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                          {featuredArticles[0].category}
                        </span>
                      )}
                      {isNewArticle(featuredArticles[0].createdAt) && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {formatDate(featuredArticles[0].createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {featuredArticles[0].readTime || '1'} min read
                        </span>
                      </div>
                      
                      <Link to={`/news/${featuredArticles[0]._id}`}>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {featuredArticles[0].title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 text-lg">
                        {featuredArticles[0].summary || featuredArticles[0].content.substring(0, 200) + '...'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        to={`/news/${featuredArticles[0]._id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 shadow-md"
                      >
                        Read Full Story
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                      
                      <div className="flex items-center gap-3">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          <Bookmark className="w-5 h-5" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                        </motion.button>
                        {isAdmin && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => onEdit(featuredArticles[0]._id)}
                              className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              aria-label="Edit news"
                            >
                              <Edit2 className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => onDelete(featuredArticles[0]._id)}
                              className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              aria-label="Delete news"
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            </motion.div>
          )}
          
          {/* Regular Articles Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {regularArticles.map((newsItem, index) => (
              <motion.article
                key={newsItem._id}
                variants={itemVariants}
                whileHover="hover"
                layout
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden group relative
                  ${index === 0 || index === 3 ? 'md:col-span-2 lg:col-span-1' : ''}
                  ${index === 5 ? 'lg:col-span-2' : ''}
                  hover:shadow-xl transition-all duration-300`}
                style={{
                  transformOrigin: 'center'
                }}
              >
                {newsItem.imageUrl && (
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={`${apiBaseUrl}${newsItem.imageUrl}`}
                      alt={newsItem.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={handleImageError}
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {newsItem.category && (
                        <span className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm bg-opacity-80">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {newsItem.category}
                        </span>
                      )}
                      {isNewArticle(newsItem.createdAt) && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <span className="bg-black/50 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {Math.floor(Math.random() * 100) + 10}
                      </span>
                      <span className="bg-black/50 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {Math.floor(Math.random() * 10)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {formatDate(newsItem.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
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
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      >
                        <Bookmark className="w-5 h-5" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </motion.button>
                      {isAdmin && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => onEdit(newsItem._id)}
                            className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            aria-label="Edit news"
                          >
                            <Edit2 className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => onDelete(newsItem._id)}
                            className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            aria-label="Delete news"
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="col-span-full text-center py-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 max-w-lg mx-auto">
            <div className="mb-6">
              <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              {searchTerm ? 'No matching articles found' : 'No news available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms or browse our latest stories.' 
                : 'Check back soon for the latest news and updates!'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewsList;