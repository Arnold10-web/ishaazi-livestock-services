import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Users, ExternalLink, Tag, UserPlus, 
  TrendingUp, Crown, Sparkles, PartyPopper
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EventList = ({ events, apiBaseUrl, isLoading, onRegisterClick }) => {
  // Enhanced skeleton loader component
  const SkeletonCard = ({ index }) => (
    <motion.div
      key={`skeleton-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/20" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 p-6 space-y-4">
        {/* Image skeleton */}
        <motion.div 
          className="h-48 bg-gradient-to-r from-purple-200/50 to-pink-200/50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <motion.div 
            className="h-6 bg-gradient-to-r from-purple-200/60 to-pink-200/60 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg w-3/4"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <div className="space-y-2">
            <motion.div 
              className="h-4 bg-gradient-to-r from-purple-100/60 to-pink-100/60 dark:from-purple-900/30 dark:to-pink-900/30 rounded w-full"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            />
            <motion.div 
              className="h-4 bg-gradient-to-r from-purple-100/60 to-pink-100/60 dark:from-purple-900/30 dark:to-pink-900/30 rounded w-2/3"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </div>
          
          {/* Meta skeleton */}
          <div className="space-y-2 pt-2">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                className="h-4 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/25 dark:to-pink-900/25 rounded w-1/2"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 + i * 0.2 }}
              />
            ))}
          </div>
          
          {/* Button skeleton */}
          <motion.div 
            className="h-10 bg-gradient-to-r from-purple-200/60 to-pink-200/60 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl w-full"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
        </div>
      </div>
    </motion.div>
  );

  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    );
  }
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (events.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center py-24 px-12"
      >
        {/* Enhanced glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative w-28 h-28 mx-auto"
          >
            {/* Event icon background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-3xl" />
            <div className="relative flex items-center justify-center w-full h-full">
              <Calendar className="w-14 h-14 text-white drop-shadow-lg" />
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <PartyPopper className="w-4 h-4 text-white" />
              </motion.div>
            </div>
          </motion.div>
          
          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent"
            >
              No Events Found
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed"
            >
              🎪 No events are currently scheduled. Check back soon for exciting agricultural events, workshops, and conferences!
            </motion.p>
            
            {/* Animated call-to-action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <motion.div
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-400/20 dark:to-pink-400/20 rounded-2xl border border-purple-200/30 dark:border-purple-300/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-medium">Stay tuned for upcoming events!</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {events.map((event, index) => {
          const isPastEvent = new Date(event.startDate) < new Date();
          const isUpcoming = new Date(event.startDate) > new Date();
          const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
          const isFeatured = event.featured || Math.random() > 0.7; // Random featured for demo
          const isPopular = event.attendees > 50 || Math.random() > 0.8; // Random popular for demo
          
          return (
            <motion.div
              key={event._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group relative overflow-hidden cursor-pointer"
            >
              {/* Enhanced glassmorphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/20 transition-all duration-500 group-hover:border-white/50 dark:group-hover:border-white/30" />
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-rose-500/5 rounded-2xl transition-all duration-500" />
              
              {/* Floating particles on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -25, 0],
                      opacity: [0, 0.6, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10">
                {/* Event image */}
                <div className="relative h-52 overflow-hidden rounded-t-2xl">
                  {event.imageUrl ? (
                    <motion.img
                      src={`${apiBaseUrl}${event.imageUrl}`}
                      alt={event.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-event.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center relative overflow-hidden">
                      {/* Animated background pattern */}
                      <motion.div
                        className="absolute inset-0 opacity-10"
                        animate={{ 
                          backgroundPosition: ["0% 0%", "100% 100%"],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{
                          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                          backgroundSize: "30px 30px"
                        }}
                      />
                      <Calendar className="w-16 h-16 text-white opacity-80 relative z-10" />
                    </div>
                  )}
                  
                  {/* Enhanced status badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {isPastEvent && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-800/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-gray-600/50"
                      >
                        Past Event
                      </motion.div>
                    )}
                    {isToday && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center border border-red-400/50"
                      >
                        <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                        Today
                      </motion.div>
                    )}
                    {isUpcoming && !isToday && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-emerald-500/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-400/50"
                      >
                        Upcoming
                      </motion.div>
                    )}
                    {isFeatured && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-yellow-500/95 to-orange-500/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center border border-yellow-400/50"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Featured
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Enhanced category tag */}
                  {event.category && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute top-3 right-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-800 dark:text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {event.category}
                    </motion.div>
                  )}
                  
                  {/* Popular indicator */}
                  {isPopular && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500/95 to-rose-500/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center border border-pink-400/50"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Popular
                    </motion.div>
                  )}
                </div>
                
                {/* Enhanced event details */}
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <motion.h3 
                      className="text-xl font-bold text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      {event.title}
                    </motion.h3>
                    
                    {/* Enhanced description */}
                    <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {event.description ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: event.description.substring(0, 120) + (event.description.length > 120 ? '...' : '') 
                        }} />
                      ) : (
                        <p className="italic">No description available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced event details with glassmorphism */}
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.4)" }}
                    >
                      <Calendar className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{formatDate(event.startDate)}</span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.4)" }}
                    >
                      <Clock className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{formatTime(event.startDate)}</span>
                    </motion.div>
                    
                    {event.location && (
                      <motion.div 
                        className="flex items-center text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.4)" }}
                      >
                        <MapPin className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
                        <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                      </motion.div>
                    )}
                    
                    {event.capacity && (
                      <motion.div 
                        className="flex items-center text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.4)" }}
                      >
                        <Users className="w-4 h-4 mr-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium">Capacity: {event.capacity}</span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Enhanced action buttons */}
                  <div className="space-y-3 pt-2">
                    {/* Registration button for upcoming events */}
                    {isUpcoming && onRegisterClick && (
                      <motion.button
                        onClick={() => onRegisterClick(event)}
                        className="group/btn relative overflow-hidden w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative flex items-center justify-center">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register Now
                        </div>
                      </motion.button>
                    )}
                    
                    {/* Enhanced view details button */}
                    <Link to={`/events/${event._id}`}>
                      <motion.div
                        className="group/btn relative overflow-hidden w-full py-3 px-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 dark:from-purple-400/20 dark:to-pink-400/20 dark:hover:from-purple-400/30 dark:hover:to-pink-400/30 text-purple-700 dark:text-purple-300 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm border border-purple-200/30 dark:border-purple-300/30 hover:border-purple-300/50 dark:hover:border-purple-200/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative flex items-center justify-center">
                          <span>View Details</span>
                          <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default EventList;