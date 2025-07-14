import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Trash2, ArrowRight, Calendar, Eye, Scale, 
  Clock, Heart 
} from 'lucide-react';
import { useEngagement } from '../hooks/useEngagement';

const BeefList = ({ beefs, apiBaseUrl, isAdmin, onDelete, onEdit, isLoading, viewMode = 'grid' }) => {
  
  /**
   * Individual beef item component with per-item engagement functionality
   */
  const BeefItem = React.memo(({ beef, index }) => {
    // Per-item engagement hook - no view tracking to prevent false counts
    const { stats, toggleLike, loading: engagementLoading } = useEngagement('beef', beef._id, { trackViews: false });
    const [isLiked, setIsLiked] = useState(stats.isLiked || false);

    // Update isLiked state when stats change
    React.useEffect(() => {
      setIsLiked(stats.isLiked || false);
    }, [stats.isLiked]);

    const handleLike = useCallback(async () => {
      if (isAdmin || engagementLoading) return; // Don't allow likes in admin view
      
      try {
        const newLikedState = await toggleLike(isLiked);
        setIsLiked(newLikedState);
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    }, [engagementLoading, toggleLike, isLiked]);

    return (
      <motion.article
        key={beef._id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ 
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{ 
          y: viewMode === 'list' ? -4 : -8,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        className={`group relative backdrop-blur-md bg-white/10 border border-white/20 
                   shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden
                   before:absolute before:inset-0 before:bg-gradient-to-br before:from-red-100/20 before:to-orange-100/20 
                   before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                   ${viewMode === 'list' 
                     ? 'flex rounded-3xl' 
                     : 'flex flex-col rounded-3xl'
                   }`}
      >
        {/* Image container */}
        {beef.imageUrl && (
          <div className={`relative overflow-hidden ${
            viewMode === 'list' 
              ? 'w-64 lg:w-80 flex-shrink-0 aspect-[4/3] rounded-l-3xl' 
              : 'aspect-[16/10] rounded-t-3xl'
          }`}>
            <motion.img
              src={`${apiBaseUrl}${beef.imageUrl}`}
              alt={beef.title}
              onError={handleImageError}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            
            {/* Enhanced overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Category badge */}
            {beef.category && (
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 left-4 backdrop-blur-md bg-red-500/90 text-white text-xs font-semibold 
                           px-3 py-2 rounded-full border border-white/20 shadow-lg
                           flex items-center gap-1.5"
              >
                <Scale className="w-3 h-3" />
                {beef.category}
              </motion.span>
            )}

            {/* Read time badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-4 right-4 backdrop-blur-md bg-white/20 border border-white/30 
                         rounded-xl px-3 py-1.5 text-white text-xs font-medium shadow-lg
                         flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3" />
              {Math.ceil((beef.content?.length || 500) / 200)} min read
            </motion.div>
          </div>
        )}
        
        {/* Enhanced content section */}
        <div className={`p-6 flex-1 flex flex-col relative z-20 ${viewMode === 'list' ? 'justify-between' : ''}`}>
          {/* Meta information */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between text-xs text-red-600/70 mb-3"
          >
            <div className="flex items-center gap-2 backdrop-blur-sm bg-red-50/50 px-3 py-1.5 rounded-full border border-red-200/30">
              <Calendar className="w-3 h-3" />
              {formatDate(beef.createdAt)}
            </div>
          </motion.div>
          
          {/* Enhanced title */}
          <Link to={`/beef/${beef._id}`} className="group/title mb-3 block">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent
                         group-hover/title:from-red-600 group-hover/title:to-orange-600 transition-all duration-300
                         leading-tight line-clamp-2"
            >
              {beef.title}
            </motion.h2>
          </Link>
          
          {/* Enhanced content preview */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600/80 text-sm leading-relaxed flex-grow line-clamp-3 mb-4"
          >
            {truncateContent(beef.content)}
          </motion.p>
          
          {/* Enhanced stats and interaction section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center pt-4 border-t border-red-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-red-600/70 text-sm">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{beef.views || 0}</span>
              </div>
              
              {/* Like section - different behavior for admin vs public */}
              {isAdmin ? (
                // Admin view: display-only likes count
                <div className="flex items-center gap-1.5 text-orange-600/70 text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">{stats.likes || beef.likes || 0}</span>
                </div>
              ) : (
                // Public view: interactive like button
                <motion.button
                  onClick={handleLike}
                  disabled={engagementLoading}
                  className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
                    isLiked 
                      ? 'text-red-600' 
                      : 'text-orange-600/70 hover:text-orange-600'
                  } ${engagementLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={engagementLoading ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <span className="font-medium">{stats.likes || beef.likes || 0}</span>
                </motion.button>
              )}
            </div>
            
            <Link
              to={`/beef/${beef._id}`}
              className="group/link inline-flex items-center gap-2 text-red-600 hover:text-orange-600 
                         font-semibold text-sm transition-all duration-300
                         hover:gap-3 relative"
            >
              <span>Read More</span>
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-red-600 to-orange-600 
                           w-0 group-hover/link:w-full transition-all duration-300"
              />
            </Link>
          </motion.div>
          
          {/* Enhanced admin controls */}
          {isAdmin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 flex gap-2 justify-end pt-3 border-t border-red-100/50"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(beef._id)}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-blue-50/80 border border-blue-200/50
                           text-blue-600 hover:bg-blue-100/80 hover:text-blue-700 
                           transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(beef._id)}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-red-50/80 border border-red-200/50
                           text-red-600 hover:bg-red-100/80 hover:text-red-700 
                           transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.article>
    );
  });

  // Utility functions
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

  // Simple skeleton loader component
  const BeefSkeleton = ({ viewMode = 'grid' }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-14 h-14 bg-red-500/10 rounded-full animate-pulse" />
        <div className="absolute bottom-8 left-6 w-6 h-6 bg-orange-500/10 rounded-full animate-bounce" />
      </div>
      
      <div className={`relative p-8 ${viewMode === 'list' ? 'flex flex-row space-x-6 space-y-0' : 'space-y-6'}`}>
        <div className={`bg-gradient-to-br from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 animate-pulse backdrop-blur-sm border border-white/10 ${
          viewMode === 'list' 
            ? 'w-64 lg:w-80 flex-shrink-0 aspect-[4/3] rounded-2xl' 
            : 'aspect-[16/9] rounded-2xl'
        }`} />
        <div className={`space-y-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="h-6 bg-gradient-to-r from-gray-200/50 to-gray-300/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-xl animate-pulse w-4/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-3/5" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-full" />
          <div className="h-4 bg-gradient-to-r from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/20 rounded-lg animate-pulse w-5/6" />
        </div>
      </div>
    </motion.div>
  );

  // Empty state
  if (beefs.length === 0 && !isLoading) {
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
              className="absolute w-2 h-2 bg-red-500/20 rounded-full"
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
            className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl"
          >
            <Scale className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-3">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              No Beef Information Found
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto"
            >
              Check back later for comprehensive beef farming content and expert insights!
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
                className="w-2 h-2 bg-red-500 rounded-full"
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
      <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}>
        {[1, 2, 3, 4, 5, 6].map(i => <BeefSkeleton key={i} viewMode={viewMode} />)}
      </div>
    );
  }

  return (
    <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}>
      <AnimatePresence mode="popLayout">
        {beefs.map((beef, index) => (
          <BeefItem 
            key={beef._id} 
            beef={beef} 
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BeefList;
