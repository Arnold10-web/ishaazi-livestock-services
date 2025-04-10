import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => {
        const isPastEvent = new Date(event.startDate) < new Date();
        
        return (
          <motion.div
            key={event._id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              isPastEvent ? 'opacity-60' : 'hover:shadow-xl'
            }`}
          >
            {event.imageUrl && (
              <img
                src={`${apiBaseUrl}${event.imageUrl}`}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {event.title}
                {isPastEvent && <span className="ml-2 text-sm text-gray-500">(Past Event)</span>}
              </h3>
              
              {/* Render HTML content safely */}
              <div 
                className="text-gray-600 mb-4 event-description" 
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-2 text-green-500" />
                  <span>{formatTime(event.startDate)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-2 text-red-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default EventList;