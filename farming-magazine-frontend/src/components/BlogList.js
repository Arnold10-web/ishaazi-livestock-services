import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, ArrowRight } from 'lucide-react';

const BlogList = ({ 
  blogs, 
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit, 
  isLoading 
}) => {
  // Utility functions remain the same
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Enhanced skeleton loader with shimmer effect
  const BlogSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-sm p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );

  // Empty state with animation
  if (blogs.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <AlertCircle className="w-16 h-16 text-blue-400/80" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-semibold text-gray-800">No Blogs Found</h3>
        <p className="mt-2 text-gray-600">Check back soon for new content!</p>
      </motion.div>
    );
  }

  // Loading state with skeleton grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map(i => <BlogSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {blogs.map((blog, index) => (
            <motion.article
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {blog.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <motion.img
                    src={`${apiBaseUrl}${blog.imageUrl}`}
                    alt={blog.title}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              
              <div className="p-6">
                <Link 
                  to={`/blog/${blog._id}`}
                  className="block group/title"
                >
                  <h2 className="text-xl font-semibold text-gray-800 group-hover/title:text-blue-600 transition-colors duration-200">
                    {blog.title}
                  </h2>
                </Link>
                
                <time className="block mt-2 text-sm text-gray-500">
                  {formatDate(blog.createdAt)}
                </time>
                
                <p className="mt-3 text-gray-600 line-clamp-3">
                  {truncateContent(blog.content)}
                </p>
                
                <div className="mt-6 flex items-center justify-between">
                  <Link 
                    to={`/blog/${blog._id}`}
                    className="inline-flex items-center gap-1.5 text-blue-600 font-medium group/link"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(blog._id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                        aria-label="Edit blog"
                      >
                        <Edit2 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(blog._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                        aria-label="Delete blog"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BlogList;