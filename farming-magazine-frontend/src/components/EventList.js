import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ExternalLink, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventList = ({ events, apiBaseUrl, isLoading }) => {
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">
          No events found
        </h2>
        <p className="text-gray-500 mt-2">
          No events are currently scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {events.map((event, index) => {
        const isPastEvent = new Date(event.startDate) < new Date();
        const isUpcoming = new Date(event.startDate) > new Date();
        const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
        
        return (
          <motion.div
            key={event._id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 ${isPastEvent ? 'opacity-75' : 'hover:shadow-xl'}`}
          >
            <div className="relative">
              {/* Event image */}
              <div className="relative h-52 overflow-hidden">
                {event.imageUrl ? (
                  <img
                    src={`${apiBaseUrl}${event.imageUrl}`}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-event.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                
                {/* Event status badge */}
                {isPastEvent && (
                  <div className="absolute top-3 left-3 bg-gray-800/80 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Past Event
                  </div>
                )}
                {isToday && (
                  <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    Today
                  </div>
                )}
                {isUpcoming && !isToday && (
                  <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Upcoming
                  </div>
                )}
                
                {/* Category tag */}
                {event.category && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {event.category}
                  </div>
                )}
              </div>
              
              {/* Event details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {event.title}
                </h3>
                
                {/* Event description */}
                <div className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm">
                  {event.description ? (
                    <div dangerouslySetInnerHTML={{ __html: event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '') }} />
                  ) : (
                    <p>No description available</p>
                  )}
                </div>
                
                {/* Event details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{formatTime(event.startDate)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-red-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      <span>Capacity: {event.capacity}</span>
                    </div>
                  )}
                </div>
                
                {/* Event action */}
                <div className="mt-6">
                  <Link 
                    to={`/events/${event._id}`} 
                    className="inline-flex items-center justify-center w-full py-2 px-4 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-600 dark:group-hover:text-white"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {events.length === 0 && !isLoading && (
        <div className="col-span-1 md:col-span-2 xl:col-span-3 flex justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center max-w-md">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">No events found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no events matching your criteria. Try adjusting your filters or check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;