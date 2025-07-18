/**
 * FarmList Component
 * 
 * Renders a collection of farm listings with interactive UI elements, animations,
 * and supports both grid and list view modes. Features include floating particles,
 * hover effects, and admin controls.
 * 
 * @module components/FarmList
 */
import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Home, 
  Tractor,
  Crown,
  TreePine,
  Sprout,
  TrendingUp,
  Tag
} from 'lucide-react';

/**
 * Formats price values with Ugandan Shilling currency format
 * @param {number} price - Price value to format
 * @returns {string} Formatted price string with UGX currency symbol
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};
/**
 * Renders a list of farm listings with support for grid and list views
 * 
 * @param {Object} props - Component props
 * @param {Array} props.farms - Array of farm objects to display
 * @param {string} props.apiBaseUrl - Base URL for API requests (used for image paths)
 * @param {boolean} props.isAdmin - Whether to display admin controls
 * @param {Function} props.onDelete - Callback for delete action
 * @param {Function} props.onEdit - Callback for edit action
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @param {string} props.viewMode - Display mode ('grid' or 'list')
 * @returns {JSX.Element} Rendered farm list component
 */
const FarmList = ({ farms = [], apiBaseUrl, isAdmin, onDelete, onEdit, isLoading, viewMode = 'grid' }) => {
  /** State to track which card is currently being hovered */
  const [hoveredCard, setHoveredCard] = useState(null);
  
  /**
   * Handles image loading errors by replacing with default placeholder
   * @param {Event} e - Image error event
   */
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-farm-image.jpg';
  };

  /**
   * Truncates HTML description content to specified length
   * @param {string} description - HTML content to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated plain text with ellipsis if needed
   */
  const truncateDescription = (description, maxLength = 150) => {
    if (!description) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = DOMPurify.sanitize(description);
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  /**
   * Formats date strings into localized, human-readable format
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date string (e.g., "January 1, 2023")
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Enhanced skeleton loader component with glassmorphism and animated particles
   * Supports both grid and list view modes
   * 
   * @param {Object} props - Component props
   * @param {string} props.viewMode - Display mode ('grid' or 'list')
   * @returns {JSX.Element} Animated skeleton loader
   */
  const FarmSkeleton = ({ viewMode = 'grid' }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      {/* Floating particles for skeleton - adds visual interest during loading */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
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
                      shadow-xl animate-pulse h-full ${
                        viewMode === 'list' ? 'flex flex-row space-x-6 space-y-0' : 'space-y-4'
                      }`}>
        <div className={`bg-gradient-to-br from-teal-100/50 to-green-100/50 rounded-xl relative overflow-hidden ${
          viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'h-48'
        }`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: [-300, 300] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="h-6 bg-gradient-to-r from-teal-200/60 to-green-200/60 rounded-lg w-4/5" />
          <div className="h-4 bg-gradient-to-r from-teal-100/50 to-green-100/50 rounded w-2/3" />
          <div className="h-4 bg-gradient-to-r from-teal-100/40 to-green-100/40 rounded w-full" />
          <div className="h-4 bg-gradient-to-r from-teal-100/40 to-green-100/40 rounded w-3/4" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-3 bg-teal-100/40 rounded w-1/4" />
            <div className="h-3 bg-green-100/40 rounded w-1/5" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Enhanced empty state with glassmorphism
  if (farms.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center p-16 backdrop-blur-md bg-gradient-to-br from-teal-50/80 to-green-50/80 
                   border border-white/30 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Floating particles background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-teal-300/40 rounded-full"
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

        {/* Enhanced farm icon with animations */}
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
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-400 to-green-500 rounded-full 
                          flex items-center justify-center shadow-lg relative overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Home className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-teal-300/30 to-green-400/30 rounded-full"
            />
          </div>
          {/* Small farm elements as decoration */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute -top-2 -right-2"
          >
            <TreePine className="w-6 h-6 text-teal-600" />
          </motion.div>
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, -15, 15, 0]
            }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-2 -left-2"
          >
            <Sprout className="w-5 h-5 text-green-600" />
          </motion.div>
        </motion.div>

        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent mb-4"
        >
          No Farms Available
        </motion.h3>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-teal-600/80 text-lg max-w-md mx-auto leading-relaxed"
        >
          Discover amazing agricultural properties and farm opportunities. 
          We're working on adding new farm listings. Check back soon for available properties!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['Crop Farms', 'Livestock', 'Organic', 'Irrigation', 'Equipment'].map((topic, index) => (
            <motion.span
              key={topic}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 backdrop-blur-sm bg-teal-100/60 border border-teal-200/50 
                         rounded-full text-teal-700 text-sm font-medium shadow-sm"
            >
              {topic}
            </motion.span>
          ))}
        </motion.div>

        <motion.div 
          className="mt-8 p-4 backdrop-blur-sm bg-teal-50/60 border border-teal-200/30 rounded-xl text-teal-700 text-sm"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p>💡 Subscribe to our newsletter to get notified when new farms are listed.</p>
        </motion.div>
      </motion.div>
    );
  }

  // Loading state: Display skeleton loaders
  if (isLoading) {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        : "space-y-6"
      }>
        {[1, 2, 3].map((i) => (
          <FarmSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      : "space-y-6"
    }>
      <AnimatePresence mode="popLayout">
        {farms.map((farm, index) => (
          <motion.article
            key={farm._id}
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
              y: viewMode === 'grid' ? -8 : -4,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            onMouseEnter={() => setHoveredCard(farm._id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl 
                       shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden
                       before:absolute before:inset-0 before:bg-gradient-to-br before:from-teal-100/20 before:to-green-100/20 
                       before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 ${
                         viewMode === 'list' 
                           ? 'flex flex-row items-stretch' 
                           : 'flex flex-col'
                       }`}
          >
            {/* Floating particles on hover */}
            <AnimatePresence>
              {hoveredCard === farm._id && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="absolute w-1.5 h-1.5 bg-teal-400/60 rounded-full"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Enhanced image container - clean with no overlays */}
            {farm.imageUrl && (
              <div className={`relative overflow-hidden ${
                viewMode === 'list' 
                  ? 'w-64 lg:w-80 flex-shrink-0 aspect-[4/3]' 
                  : 'aspect-[16/10] rounded-t-3xl'
              } ${viewMode === 'list' ? 'rounded-l-3xl' : ''}`}>
                <motion.img
                  src={`${apiBaseUrl}${farm.imageUrl}`}
                  alt={farm.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                
                {/* Enhanced overlay with gradient - no badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
            
            {/* Enhanced content section */}
            <div className={`p-6 flex-1 flex flex-col relative z-20 ${
              viewMode === 'list' ? 'justify-between' : ''
            }`}>
              {/* Badges section - moved from image overlay */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between flex-wrap gap-2 mb-4"
              >
                <div className="flex items-center gap-2">
                  {/* Price badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="backdrop-blur-md bg-teal-500/90 text-white 
                               px-3 py-2 rounded-full border border-white/20 shadow-lg
                               flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <DollarSign className="w-3 h-3" />
                    {formatPrice(farm.price)}
                  </motion.div>
                  
                  {/* Featured badge */}
                  {farm.featured && (
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
                
                <div className="flex items-center gap-2">
                  {/* Location badge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="backdrop-blur-md bg-white/20 border border-white/30 
                               rounded-xl px-3 py-2 text-gray-700 text-xs font-medium shadow-lg
                               flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3" />
                    {farm.location}
                  </motion.div>
                  
                  {/* Size badge - only show if size exists */}
                  {farm.size && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="backdrop-blur-md bg-white/20 border border-white/30 
                                 rounded-xl px-3 py-1.5 text-gray-700 text-xs font-medium shadow-lg
                                 flex items-center gap-1.5"
                    >
                      <Tractor className="w-3 h-3" />
                      {farm.size}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Meta information with tags */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between text-xs text-teal-600/70 mb-3"
              >
                <div className="flex items-center gap-2 backdrop-blur-sm bg-teal-50/50 px-3 py-1.5 rounded-full border border-teal-200/30">
                  <Calendar className="w-3 h-3" />
                  {formatDate(farm.createdAt)}
                </div>
                
                <div className="flex items-center gap-2">
                  {farm.farmType && (
                    <span className="backdrop-blur-sm bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-200/30 
                                     px-3 py-1.5 rounded-full text-green-600/80 font-medium flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      {farm.farmType}
                    </span>
                  )}
                  {farm.type && (
                    <span className="backdrop-blur-sm bg-green-50/50 px-3 py-1.5 rounded-full border border-green-200/30 
                                     text-green-600/80 font-medium">
                      {farm.type}
                    </span>
                  )}
                </div>
              </motion.div>
              
              {/* Enhanced title */}
              <Link to={`/farm/${farm._id}`} className="group/title mb-3 block">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent
                             group-hover/title:from-teal-600 group-hover/title:to-green-600 transition-all duration-300
                             leading-tight line-clamp-2"
                >
                  {farm.name}
                </motion.h2>
              </Link>
              
              {/* Enhanced content preview */}
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600/80 text-sm leading-relaxed flex-grow line-clamp-3 mb-4"
              >
                {truncateDescription(farm.description)}
              </motion.p>
              
              {/* Facilities tags */}
              {farm.facilities && farm.facilities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-wrap gap-2 mb-4"
                >
                  {farm.facilities.slice(0, 3).map((facility, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 
                                 text-blue-600/80 px-2 py-1 rounded-full font-medium flex items-center gap-1"
                    >
                      <TreePine className="w-3 h-3" />
                      {facility}
                    </span>
                  ))}
                  {farm.facilities.length > 3 && (
                    <span className="text-xs text-gray-500/80 px-2 py-1">
                      +{farm.facilities.length - 3} more
                    </span>
                  )}
                </motion.div>
              )}
              
              {/* Enhanced stats and interaction section */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-between items-center pt-4 border-t border-teal-100/50"
              >
                <div className="flex items-center gap-4">
                  {farm.size && (
                    <div className="flex items-center gap-1.5 text-teal-600/70 text-sm">
                      <Tractor className="w-4 h-4" />
                      <span className="font-medium">{farm.size}</span>
                    </div>
                  )}
                  {farm.views > 500 && (
                    <div className="flex items-center gap-1 text-teal-500 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-semibold">Popular</span>
                    </div>
                  )}
                </div>
                
                <Link
                  to={`/farm/${farm._id}`}
                  className="group/link inline-flex items-center gap-2 text-teal-600 hover:text-green-600 
                             font-semibold text-sm transition-all duration-300
                             hover:gap-3 relative"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  <motion.div
                    className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-teal-600 to-green-600 
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
                  className={`flex gap-2 justify-end ${
                    viewMode === 'list' 
                      ? 'mt-2' 
                      : 'mt-4 pt-3 border-t border-teal-100/50'
                  }`}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(farm._id)}
                    className="p-2.5 rounded-xl backdrop-blur-sm bg-blue-50/80 border border-blue-200/50
                               text-blue-600 hover:bg-blue-100/80 hover:text-blue-700 
                               transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(farm._id)}
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
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FarmList;
