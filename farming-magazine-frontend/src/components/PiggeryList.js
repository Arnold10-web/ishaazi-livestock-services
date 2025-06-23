import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Tag, 
  Eye, 
  Heart, 
  Clock,
  Crown,
  TrendingUp
} from 'lucide-react';
import { useEngagement } from '../hooks/useEngagement';

const PiggeryList = ({ 
  piggeries = [], // Add default empty array
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit, 
  isLoading,
  viewMode = 'grid' // Add viewMode prop with default value
}) => {
  // Removed hoveredCard state to prevent unnecessary re-renders on hover

  /**
   * Individual piggery item component with engagement functionality
   */
  const PiggeryItem = React.memo(({ piggery, index }) => {
    // Don't track views in list view - only fetch stats for display
    const { stats, toggleLike, loading: engagementLoading } = useEngagement('piggeries', piggery._id);
    const [isLiked, setIsLiked] = useState(stats.isLiked || false);

    // Update isLiked state when stats change
    React.useEffect(() => {
      setIsLiked(stats.isLiked || false);
    }, [stats.isLiked]);

    const handleLike = React.useCallback(async () => {
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
        key={piggery._id}
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
                   before:absolute before:inset-0 before:bg-gradient-to-br before:from-amber-100/20 before:to-orange-100/20 
                   before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                   ${viewMode === 'list' 
                     ? 'flex rounded-3xl' 
                     : 'flex flex-col rounded-3xl'
                   }`}
      >

        {/* Image container */}
        {piggery.imageUrl && (
          <div className={`relative overflow-hidden ${
            viewMode === 'list' 
              ? 'w-48 h-32 rounded-l-3xl flex-shrink-0' 
              : 'aspect-[16/10] rounded-t-3xl'
          }`}>
            <motion.img
              src={`${apiBaseUrl}${piggery.imageUrl}`}
              alt={piggery.title}
              onError={handleImageError}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            
            {/* Enhanced overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Top badges container */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {piggery.breed && (
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="backdrop-blur-md bg-amber-500/90 text-white text-xs font-semibold 
                             px-3 py-2 rounded-full border border-white/20 shadow-lg
                             flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3" />
                  {piggery.breed}
                </motion.span>
              )}
              
              {/* Premium/Featured badge */}
              {piggery.featured && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-md bg-gradient-to-r from-yellow-400 to-orange-500 
                             text-white text-xs font-bold px-3 py-2 rounded-full 
                             border border-white/30 shadow-lg flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  Featured
                </motion.span>
              )}
            </div>

            {/* Enhanced read time badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-4 right-4 backdrop-blur-md bg-white/20 border border-white/30 
                         rounded-xl px-3 py-1.5 text-white text-xs font-medium shadow-lg
                         flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3" />
              {Math.ceil((piggery.content?.length || 500) / 200)} min read
            </motion.div>
          </div>
        )}
        
        {/* Enhanced content section */}
        <div className={`p-6 flex-1 flex flex-col relative z-20 ${
          viewMode === 'list' ? 'justify-center' : ''
        }`}>
          {/* Meta information */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between text-xs text-amber-600/70 mb-3"
          >
            <div className="flex items-center gap-2 backdrop-blur-sm bg-pink-50/50 px-3 py-1.5 rounded-full border border-pink-200/30">
              <Calendar className="w-3 h-3" />
              {formatDate(piggery.createdAt)}
            </div>
            
            {piggery.category && (
              <span className="backdrop-blur-sm bg-rose-50/50 px-3 py-1.5 rounded-full border border-rose-200/30 
                               text-rose-600/80 font-medium">
                {piggery.category}
              </span>
            )}
          </motion.div>
          
          {/* Enhanced title */}
          <Link to={`/piggery/${piggery._id}`} className="group/title mb-3 block">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent
                         group-hover/title:from-pink-600 group-hover/title:to-rose-600 transition-all duration-300
                         leading-tight line-clamp-2"
            >
              {piggery.title}
            </motion.h2>
          </Link>
          
          {/* Enhanced content preview */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600/80 text-sm leading-relaxed flex-grow line-clamp-3 mb-4"
          >
            {truncateContent(piggery.content)}
          </motion.p>
          
          {/* Enhanced stats and interaction section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center pt-4 border-t border-pink-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-pink-600/70 text-sm">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{stats.views || piggery.views || 0}</span>
              </div>
              
              {/* Like button - interactive for public, display-only for admin */}
              {isAdmin ? (
                <div className="flex items-center gap-1.5 text-rose-600/70 text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">{stats.likes || piggery.likes || 0}</span>
                </div>
              ) : (
                <motion.button
                  onClick={handleLike}
                  disabled={engagementLoading}
                  className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
                    isLiked 
                      ? 'text-red-600' 
                      : 'text-rose-600/70 hover:text-red-600'
                  } ${engagementLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{stats.likes || piggery.likes || 0}</span>
                </motion.button>
              )}
              
              {piggery.views > 1000 && (
                <div className="flex items-center gap-1 text-pink-500 text-xs">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-semibold">Trending</span>
                </div>
              )}
            </div>
            
            <Link
              to={`/piggery/${piggery._id}`}
              className="group/link inline-flex items-center gap-2 text-pink-600 hover:text-rose-600 
                         font-semibold text-sm transition-all duration-300
                         hover:gap-3 relative"
            >
              <span>Read More</span>
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
              <motion.div
                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-600 to-rose-600 
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
              className="mt-4 flex gap-2 justify-end pt-3 border-t border-pink-100/50"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(piggery._id)}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-blue-50/80 border border-blue-200/50
                           text-blue-600 hover:bg-blue-100/80 hover:text-blue-700 
                           transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(piggery._id)}
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

  // Utility function for image error handling
  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  // Utility function to truncate HTML content
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    const textContent = tempElement.textContent || tempElement.innerText || '';
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent;
  };

  // Utility function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Early return if piggeries is null or undefined
  if (!piggeries) {
    return (
      <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
        {[1, 2, 3].map(i => <PiggerySkeleton key={i} viewMode={viewMode} />)}
      </div>
    );
  }

  // Enhanced skeleton loader component with glassmorphism
  const PiggerySkeleton = ({ viewMode = 'grid' }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative ${viewMode === 'list' ? 'flex space-x-4' : ''}`}
    >
      {/* Floating particles for skeleton */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className={`relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 
                      shadow-xl animate-pulse h-full ${viewMode === 'list' ? 'flex space-x-4 w-full' : 'space-y-4'}`}>
        {/* Image skeleton */}
        <div className={`bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-xl relative overflow-hidden ${
          viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-48'
        }`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: [-300, 300] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Content skeleton */}
        <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="h-6 bg-gradient-to-r from-amber-200/60 to-orange-200/60 rounded-lg w-4/5" />
          <div className="h-4 bg-gradient-to-r from-amber-100/50 to-orange-100/50 rounded w-2/3" />
          <div className="h-4 bg-gradient-to-r from-amber-100/40 to-orange-100/40 rounded w-full" />
          <div className="h-4 bg-gradient-to-r from-amber-100/40 to-orange-100/40 rounded w-3/4" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-3 bg-amber-100/40 rounded w-1/4" />
            <div className="h-3 bg-rose-100/40 rounded w-1/5" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Enhanced empty state with glassmorphism
  if (piggeries.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center p-16 backdrop-blur-md bg-gradient-to-br from-amber-50/80 to-orange-50/80 
                   border border-white/30 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Floating particles background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-300/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        {/* Enhanced pig icon with animations */}
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full 
                          flex items-center justify-center shadow-lg relative overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white text-4xl"
            >
              🐷
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-full"
            />
          </div>
        </motion.div>

        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4"
        >
          No Piggery Content Available
        </motion.h3>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-amber-600/80 text-lg max-w-md mx-auto leading-relaxed"
        >
          Discover comprehensive pig farming guides, breeding techniques, and swine management tips. 
          Check back soon for expert piggery content!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['Breeding', 'Nutrition', 'Health', 'Management'].map((topic, index) => (
            <motion.span
              key={topic}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 backdrop-blur-sm bg-amber-100/60 border border-amber-200/50 
                         rounded-full text-amber-700 text-sm font-medium shadow-sm"
            >
              {topic}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
        {[1, 2, 3].map(i => <PiggerySkeleton key={i} viewMode={viewMode} />)}
      </div>
    );
  }

  return (
    <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}>
      <AnimatePresence mode="popLayout">
        {piggeries.map((piggery, index) => (
          <PiggeryItem key={piggery._id} piggery={piggery} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PiggeryList;