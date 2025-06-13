/**
 * EventPage.js
 * 
 * This component renders a comprehensive events listing page for the Online Farming Magazine.
 * It includes search functionality, filters by category and time, animations for improved UX,
 * and responsive design for all device sizes. The page displays events with sophisticated
 * filtering and sorting mechanisms to prioritize upcoming events.
 * 
 * Key Features:
 * - Real-time searching with dynamic filtering
 * - Category and time-based filtering (all, upcoming, today, this week, past)
 * - Interactive UI with Framer Motion animations
 * - Responsive design with mobile-optimized controls
 * - Event statistics dashboard showing counts and metrics
 * - Custom messaging for different result states (empty, single, multiple)
 * - Integration with dynamic ad components
 * 
 * @author Online Farming Magazine Team
 * @lastUpdated June 12, 2025
 * @version 2.1.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, MapPin, Search, Filter, ChevronDown } from 'lucide-react';
import EventList from '../components/EventList';
import DynamicAdComponent from '../components/DynamicAdComponent';

// Import adSlots with defensive error handling to prevent runtime crashes
// This pattern ensures the app continues working even if the ad component configuration fails
// by providing fallback default ad slots when the import fails or returns invalid data
let importedAdSlots;
try {
  const { adSlots } = require('../components/DynamicAdComponent');
  importedAdSlots = adSlots;
} catch (error) {
  console.warn('Failed to import adSlots configuration:', error);
  importedAdSlots = null;
}

/**
 * Default ad configuration to use as fallback
 * Ensures the application can still display ads with proper dimensions
 * even when the dynamic configuration is unavailable
 */
const defaultAdSlots = {
  inContent: { slot: '1122334455', format: 'rectangle', style: { minHeight: '200px' } }
};

/**
 * Multi-layer safety implementation for ad slots
 * 
 * 1. Use imported configuration if available, otherwise empty object
 * 2. Validate structure with type checking and property existence verification
 * 3. Fall back to defaults when any validation fails
 * 
 * This approach maintains resilience against configuration issues while
 * allowing dynamic ad slot updates when properly configured
 */
const adSlots = importedAdSlots || {};
const safeAdSlots = {
  inContent: (adSlots?.inContent && typeof adSlots.inContent === 'object' && adSlots.inContent.slot) 
    ? adSlots.inContent 
    : defaultAdSlots.inContent
};

/**
 * EventPage Component
 * 
 * Main component for displaying, filtering, and searching farming events
 * @returns {JSX.Element} The rendered EventPage component
 */
const EventPage = () => {
  // Event data and loading state management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filtering state management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // API configuration with environment-based fallback
  // Uses environment variable in production or local development URL as fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Effect hook to fetch events data from the API when component mounts
   * Re-runs if the API_BASE_URL changes (e.g., environment switch)
   * 
   * The implementation includes:
   * - Loading state management
   * - Error handling with user-friendly messages
   * - Proper state cleanup on success
   */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/events`);
        setEvents(response.data.data.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to fetch events. Please try again later.');
      } finally {
        // Ensure loading state is always turned off, even if there's an error
        setLoading(false);
      }
    };

    fetchEvents();
  }, [API_BASE_URL]);

  /**
   * Advanced event filtering and sorting algorithm
   * 
   * Filtering criteria:
   * 1. Text search across title, description, and location (case-insensitive)
   * 2. Category filtering with "all" option
   * 3. Time-based filtering (all, past, upcoming, today, this week)
   * 
   * Sorting logic:
   * 1. Future events prioritized over past events
   * 2. Within each group (future/past), events sorted by proximity to current date
   * 
   * @returns {Array} Filtered and sorted events array
   */
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      // Search filter - matches any text field, uses optional chaining for safety
      const matchesSearch = searchTerm === '' || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter - exact match or "all" option
      const matchesCategory = categoryFilter === 'all' || 
        event.category === categoryFilter;
      
      // Time filter - calculate various time relationships
      const now = new Date();
      const eventDate = new Date(event.startDate);
      const isPast = eventDate < now;
      const isUpcoming = eventDate > now;
      const isToday = eventDate.toDateString() === now.toDateString();
      const isThisWeek = eventDate > now && 
        eventDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
      
      // Match based on selected time filter
      const matchesTime = 
        timeFilter === 'all' ||
        (timeFilter === 'past' && isPast) ||
        (timeFilter === 'upcoming' && isUpcoming) ||
        (timeFilter === 'today' && isToday) ||
        (timeFilter === 'this-week' && isThisWeek);
      
      // Event must match all active filters
      return matchesSearch && matchesCategory && matchesTime;
    })
    .sort((a, b) => {
      const now = new Date();
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      // Smart sorting logic: future events first, then by date proximity
      const isPastA = dateA < now;
      const isPastB = dateB < now;

      // Prioritize future events
      if (isPastA && !isPastB) return 1;  // a is past, b is future -> b comes first
      if (!isPastA && isPastB) return -1; // a is future, b is past -> a comes first
      
      // Within same category (both future or both past), sort by date
      return dateA - dateB; // Ascending order by date
    });
    
  /**
   * Extract unique event categories for filter dropdown
   * 
   * Implementation details:
   * 1. Start with 'all' option for unfiltered view
   * 2. Use Set to automatically deduplicate categories
   * 3. Apply filter(Boolean) to remove null/undefined/empty values
   * 4. Spread back to array for component consumption
   * 
   * @returns {Array} Array of unique category values for filter options
   */
  const categories = ['all', ...new Set(events.map(event => event.category).filter(Boolean))];

  /**
   * Loading state UI
   * 
   * Displays a centered, animated spinner with loading text
   * Uses Framer Motion for smooth animation
   * Maintains consistent height to prevent layout shifts
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state UI
   * 
   * Displays a user-friendly error message with recovery option
   * Features:
   * - Animated entrance for better UX
   * - Clear visual indication of error state
   * - Actionable refresh button for easy recovery
   * - Preserves and displays the specific error message
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center"
          >
            <svg 
              className="w-12 h-12 text-red-500 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="relative bg-emerald-600 dark:bg-emerald-800 text-white py-16 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-white"></div>
          <div className="absolute left-1/3 bottom-0 w-60 h-60 rounded-full bg-white"></div>
        </div>
        
        {/* 
          Main container with relative positioning and z-index
          - Higher z-index ensures content stays above decorative background elements
          - Padding provides consistent spacing on various device sizes
          - Container class ensures proper width constraints and margin auto centering
        */}
        <div className="container mx-auto px-4 relative z-10">
          {/* 
            Hero text section with staggered animation
            - Text animates into view with a subtle upward motion
            - Staggered delays create a pleasing sequential reveal effect
            - Responsive typography scales appropriately across device sizes
          */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Upcoming Events
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Discover and participate in exciting farming events happening in our community.
            </motion.p>
          </motion.div>
          
          {/* 
            Search and filters - Interactive UI controls
            
            This section provides users with powerful event discovery tools:
            1. A search bar with real-time filtering across multiple fields
            2. A filter button that reveals additional filtering options
            3. Responsive layout that adapts between mobile and desktop views
            
            Accessibility features:
            - Interactive elements have appropriate visual feedback states
            - Form controls are properly labeled for screen readers
            - Focus states are visually apparent for keyboard navigation
          */}
          <motion.div 
            className="max-w-4xl mx-auto mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* 
              Search input with icon 
              - Icon positioned absolutely for visual alignment
              - Transform used for perfect vertical centering
              - Flex-grow ensures search takes available space in desktop layout
            */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                aria-label="Search events by title, description or location"
              />
            </div>
            
            {/* 
              Filter dropdown toggle button
              - Changes to full width on mobile, auto width on desktop
              - Visual feedback via hover states with color transitions
              - Icon rotation provides open/closed state indicator
            */}
            <div className="relative">
              <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-100 dark:bg-emerald-700 text-emerald-800 dark:text-white rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-600 transition-colors w-full md:w-auto"
                aria-expanded={filterOpen}
                aria-controls="filter-dropdown"
              >
                <Filter size={18} />
                <span>Filters</span>
                <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 
                Filter dropdown panel - Conditionally rendered when filters are open
                
                Features:
                - Animated entrance/exit using Framer Motion for smooth UX
                - Positioned absolutely with z-index to overlay content properly
                - Responsive sizing and proper spacing for controls
                - Dark mode support with appropriate color contrasts
              */}
              {filterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 p-4 border border-gray-100 dark:border-gray-700"
                  id="filter-dropdown"
                  role="dialog"
                  aria-label="Filter options"
                >
                  {/* 
                    Time filter - Controls temporal filtering of events
                    Options allow viewing by different time horizons (today, upcoming, past, etc.)
                  */}
                  <div className="mb-4">
                    <label 
                      htmlFor="time-filter" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Time
                    </label>
                    <select 
                      id="time-filter"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Events</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="today">Today</option>
                      <option value="this-week">This Week</option>
                      <option value="past">Past Events</option>
                    </select>
                  </div>
                  
                  {/* 
                    Category filter - Dynamically populated from available categories
                    Uses the extracted unique categories from events data
                  */}
                  <div>
                    <label 
                      htmlFor="category-filter" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Category
                    </label>
                    <select 
                      id="category-filter"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 
        Main content container
        - Container class provides consistent max-width and centered alignment
        - Padding creates proper spacing between sections
      */}
      <main className="container mx-auto px-4 py-12">
        {/* 
          Event Statistics Dashboard
          
          This section provides users with a quick overview of event metrics:
          - Shows data visualizations for key event statistics
          - Responsive grid layout adapts from 2 columns on mobile to 4 on desktop
          - Each stat card has consistent styling with unique accent colors
          - Animated entrance for visual engagement
          
          Data displayed:
          1. Count of upcoming events
          2. Count of unique event locations
          3. Count of today's events
          4. Count of events this week
        */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Upcoming Events Stat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-emerald-500" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => new Date(e.startDate) > new Date()).length}
            </p>
          </div>
          
          {/* Unique Locations Stat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-rose-500" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Locations</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(events.map(e => e.location).filter(Boolean)).size}
            </p>
          </div>
          
          {/* Today's Events Stat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => new Date(e.startDate).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          
          {/* This Week's Events Stat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">This Week</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => {
                const eventDate = new Date(e.startDate);
                const now = new Date();
                return eventDate >= now && eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              }).length}
            </p>
          </div>
        </motion.div>

        {/* 
          Results Count and Status Section
          
          Features a context-aware message that:
          - Shows different messages based on number of results found
          - Provides personalized messaging for single event results
          - Includes count metrics for current filter/search state
          - Uses animation for visual engagement
          - Implements responsive layout for different device sizes
        */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                {/* 
                  Dynamic heading with context-aware messaging
                  - Changes based on filteredAndSortedEvents.length
                  - Uses engaging and friendly tone
                  - Accompanied by animated indicator for visual appeal
                */}
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"
                    aria-hidden="true" 
                  ></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {filteredAndSortedEvents.length === 0 ? (
                      "No events match your search"
                    ) : filteredAndSortedEvents.length === 1 ? (
                      "Found: Your perfect farming event awaits!"
                    ) : (
                      `Discover ${filteredAndSortedEvents.length} exciting events`
                    )}
                  </h2>
                </div>
                
                {/* 
                  Personalized message for single event results
                  - Only shown when exactly one event is found
                  - Adds context and encouragement for the user
                  - Uses friendly, conversational tone
                */}
                {filteredAndSortedEvents.length === 1 && (
                  <p className="ml-5 mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    We've found just what you're looking for! This handpicked event matches your interests perfectly.
                  </p>
                )}
              </div>
              
              {/* 
                Additional metrics for context (desktop only)
                - Shows count of upcoming events in current result set
                - Hidden on mobile to conserve space
                - Uses calendar icon for visual reinforcement
              */}
              {filteredAndSortedEvents.length > 0 && (
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {filteredAndSortedEvents.filter(e => new Date(e.startDate) > new Date()).length} upcoming
                  </span>
                </div>
              )}
            </div>
          
          {/* 
            Clear Filters Button
            - Only displayed when active filters are present
            - Resets all filters to default state with single click
            - Uses color that stands out but doesn't compete with primary actions
            - Implements hover state for clear interaction feedback
          */}
          {(searchTerm || categoryFilter !== 'all' || timeFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTimeFilter('all');
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
              aria-label="Clear all filters and search terms"
            >
              Clear Filters
            </button>
          )}
          </div>
        </div>

        {/* 
          In-Content Ad Integration
          
          Implementation features:
          - Uses the DynamicAdComponent for standardized ad display
          - Positioned between results count and event listings for optimal visibility
          - Uses safe ad slots with comprehensive error handling
          - Consistent margin for proper spacing in layout flow
          - Style properties passed directly from configuration
          
          The component handles:
          - Ad slot identification
          - Format specification (rectangle, banner, etc.)
          - Custom styling with proper dimensions
          - Fallbacks in case of configuration issues
        */}
        <div className="mb-8">
          <DynamicAdComponent 
            slot={safeAdSlots.inContent.slot}
            format={safeAdSlots.inContent.format}
            style={safeAdSlots.inContent.style}
          />
        </div>

        {/* 
          Event List Component
          
          Wrapped in AnimatePresence for smooth transitions between different filter states
          mode="wait" ensures animations complete before new content appears
          
          Props passed:
          - events: The filtered and sorted array of events to display
          - apiBaseUrl: For proper URL construction for images and links
          - isLoading: Loading state to display appropriate UI
        */}
        <AnimatePresence mode="wait">
          <EventList 
            events={filteredAndSortedEvents} 
            apiBaseUrl={API_BASE_URL} 
            isLoading={loading}
          />
        </AnimatePresence>
        
        {/* 
          Empty State / No Results Message
          
          Conditionally rendered when:
          1. No events match the current filters
          2. The app isn't in a loading state (prevents flashing)
          
          Features:
          - Helpful, friendly message explaining the situation
          - Visual indicator (calendar icon) for quick recognition
          - Fade-in animation for smooth appearance
          - Provides guidance on what to do next (adjust filters)
          - Centered, contained design with consistent styling
        */}
        {filteredAndSortedEvents.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md mx-auto">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" aria-hidden="true" />
              <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">No events found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We couldn't find any events matching your search criteria. Try adjusting your filters or check back later.
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};

export default EventPage;