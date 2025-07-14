/**
 * EventList.js
 * 
 * This component renders a list of farming events with detailed information
 * and interactive features including registration capabilities.
 * 
 * @module EventList
 * @requires React
 * @requires framer-motion
 * @requires lucide-react
 * @requires react-router-dom
 * @requires ./EventRegistrationModal
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, UserPlus, Tag, Edit2, Trash2 } from 'lucide-react';
import EventRegistrationModal from './EventRegistrationModal';

/**
 * EventList Component
 * 
 * Displays a list of farming events with event details, animations, and registration functionality.
 *
 * @param {Object[]} events - Array of event objects to display
 * @param {string} apiBaseUrl - Base URL for API calls and resource loading
 * @param {boolean} isLoading - Loading state to show loading indicators when true
 * @param {boolean} isAdmin - Whether the user has admin privileges to edit/delete
 * @param {Function} onEdit - Function to handle editing an event
 * @param {Function} onDelete - Function to handle deleting an event
 * @returns {JSX.Element} Rendered EventList component
 */
const EventList = ({ events, apiBaseUrl, isLoading, isAdmin, onEdit, onDelete }) => {
  // State management for event registration modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Formats a date string into a human-readable long date format
   * 
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date (e.g., "Monday, June 12, 2025")
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Formats a date string to extract and format time only
   * 
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted time (e.g., "2:30 PM")
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Opens registration modal for the selected event
   * 
   * @param {Object} event - Event object for registration
   */
  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  /**
   * Closes the registration modal and clears the selected event
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  /**
   * Handles successful registration submission
   * 
   * @param {Object} registrationData - Data submitted for registration
   */
  const handleRegistrationSuccess = (registrationData) => {
    // Registration processing logic
    console.log('Registration successful:', registrationData);
    // Additional success handling could include:
    // - Showing success notification
    // - Updating registration counts
    // - Adding user to registered list
  };

  /**
   * Empty state render - Shown when no events are available and not loading
   * 
   * @returns {JSX.Element} Empty state message component
   */
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

  /**
   * Main render - Displays a responsive grid of event cards
   * 
   * Features:
   * - Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
   * - Individual card animations with staggered entrance
   * - Visual distinction between past, upcoming and today's events
   * - Registration modal integration for event signup
   * 
   * @returns {JSX.Element} Rendered event list with registration modal
   */
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {events.map((event, index) => {
        // Calculate event timing status for appropriate visual treatment
        const isPastEvent = new Date(event.startDate) < new Date();
        const isUpcoming = new Date(event.startDate) > new Date();
        const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
        
        return (
          // Event Card Component - Uses Framer Motion for animations, adapts visual treatment based on event status
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
              {/* Event Image Section - With fallback and hover effect */}
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
                  <button 
                    onClick={() => handleRegisterClick(event)}
                    disabled={isPastEvent}
                    className={`inline-flex items-center justify-center w-full py-2 px-4 rounded-lg transition-colors ${
                      isPastEvent 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-600 dark:group-hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span>{isPastEvent ? 'Event Ended' : 'Register Now'}</span>
                  </button>
                </div>
                
                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex space-x-2 justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <motion.button
                      onClick={() => onEdit(event._id)}
                      className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(event._id)}
                      className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
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

      {/* Event Registration Modal */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default EventList;