import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Trash2, ArrowRight, Calendar, Milk, Tag, Heart, Eye, 
  Clock, Award
} from 'lucide-react';

const DairyList = ({ dairies, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading }) => {
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
  const DairySkeleton = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-14 h-14 bg-blue-500/10 rounded-full animate-pulse" />
        <div className="absolute bottom-8 left-6 w-6 h-6 bg-cyan-500/10 rounded-full animate-bounce" />
      </div>
      
      <div className="relative p-8 space-y-6">
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-2xl animate-pulse backdrop-blur-sm border border-white/10" />
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-xl animate-pulse w-4/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-3/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-full" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-5/6" />
        </div>
      </div>
    </motion.div>
  );

  // Empty state
  if (dairies.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center py-24 px-12"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-500/20 rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.random() * 400,
                y: Math.random() * 300,
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-xl"
          >
            <Milk className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-3">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              No Dairy Information Found
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto"
            >
              Check back later for comprehensive dairy farming content and expert insights!
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center space-x-2"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <DairySkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {dairies.map((dairy, index) => (
          <motion.article
            key={dairy._id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="relative group cursor-pointer"
          >
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 transition-all duration-500 group-hover:from-white/15 group-hover:to-white/10 dark:group-hover:from-white/8 dark:group-hover:to-white/3" />
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Floating particles on hover */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: 20 + Math.random() * 300,
                    y: 20 + Math.random() * 200,
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 overflow-hidden rounded-3xl">
              {dairy.imageUrl && (
                <div className="relative overflow-hidden aspect-[16/9] group-hover:scale-105 transition-transform duration-700">
                  <img
                    src={`${apiBaseUrl}${dairy.imageUrl}`}
                    alt={dairy.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {dairy.category && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-6 left-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-white/20"
                    >
                      <Tag className="inline w-3 h-3 mr-1" />
                      {dairy.category}
                    </motion.span>
                  )}
                  
                  {/* Premium badge for featured content */}
                  {dairy.featured && (
                    <motion.div
                      initial={{ opacity: 0, rotate: -12 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      className="absolute top-6 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg"
                    >
                      <Award className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              )}
              
              <div className="p-8 space-y-6">
                {/* Meta information */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-2 bg-white/5 dark:bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(dairy.createdAt)}
                    </span>
                    <span className="flex items-center gap-2 bg-white/5 dark:bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Clock className="w-4 h-4" />
                      {Math.ceil((dairy.content?.length || 0) / 200)} min read
                    </span>
                  </div>
                </div>
                
                {/* Title */}
                <Link to={`/dairy/${dairy._id}`} className="group/title block">
                  <motion.h2 
                    className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover/title:from-blue-600 group-hover/title:to-cyan-600 transition-all duration-300 leading-tight"
                    whileHover={{ scale: 1.02 }}
                  >
                    {dairy.title}
                  </motion.h2>
                </Link>
                
                {/* Content preview */}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {truncateContent(dairy.content)}
                </p>

                {/* Stats and actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-white/5">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <motion.span 
                      className="flex items-center gap-2 bg-white/5 dark:bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className="w-4 h-4" />
                      {dairy.views || 0}
                    </motion.span>
                    <motion.span 
                      className="flex items-center gap-2 bg-white/5 dark:bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart className="w-4 h-4" />
                      {dairy.likes || 0}
                    </motion.span>
                  </div>
                  
                  <Link
                    to={`/dairy/${dairy._id}`}
                    className="group/read-more inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <motion.span
                      className="mr-2 font-medium"
                      whileHover={{ x: -2 }}
                    >
                      Read More
                    </motion.span>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </Link>
                </div>
                
                {/* Admin controls */}
                {isAdmin && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-end pt-4 border-t border-white/10 dark:border-white/5"
                  >
                    <motion.button
                      onClick={() => onEdit(dairy._id)}
                      className="p-3 rounded-full bg-white/5 dark:bg-white/5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(dairy._id)}
                      className="p-3 rounded-full bg-white/5 dark:bg-white/5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DairyList;
