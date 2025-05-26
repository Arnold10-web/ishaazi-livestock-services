import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Tag, Eye, Heart, ArrowRight, Edit2, Trash2, BookOpen
} from 'lucide-react';

const BlogList = ({ blogs, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading }) => {
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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const BlogSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
    </div>
  );

  if (blogs.length === 0 && !isLoading) {
    return (
      <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow">
        <BookOpen className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Blogs Available</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Please check back later for more content.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <BlogSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {blogs.map((blog, index) => (
          <motion.article
            key={blog._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {blog.imageUrl && (
              <div className="relative overflow-hidden aspect-[16/9]">
                <img
                  src={`${apiBaseUrl}${blog.imageUrl}`}
                  alt={blog.title}
                  onError={handleImageError}
                  className="object-cover w-full h-full"
                />

                {blog.category && (
                  <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    <Tag className="inline w-3 h-3 mr-1" />{blog.category}
                  </span>
                )}
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.createdAt)}
              </div>
              <Link to={`/blog/${blog._id}`} className="group mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {blog.title}
                </h2>
              </Link>
              <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">
                {truncateContent(blog.content)}
              </p>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{Math.floor(Math.random() * 1000)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{Math.floor(Math.random() * 50)}</span>
                </div>
                <Link
                  to={`/blog/${blog._id}`}
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Read More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {isAdmin && (
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => onEdit(blog._id)}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(blog._id)}
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

export default BlogList;
