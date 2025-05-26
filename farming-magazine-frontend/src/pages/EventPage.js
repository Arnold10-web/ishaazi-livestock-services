import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, MapPin, Search, Filter, ChevronDown } from 'lucide-react';
import EventList from '../components/EventList';

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        setLoading(false);
      }
    };

    fetchEvents();
  }, [API_BASE_URL]);

  // Filter and sort events
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        event.category === categoryFilter;
      
      // Time filter
      const now = new Date();
      const eventDate = new Date(event.startDate);
      const isPast = eventDate < now;
      const isUpcoming = eventDate > now;
      const isToday = eventDate.toDateString() === now.toDateString();
      const isThisWeek = eventDate > now && 
        eventDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const matchesTime = 
        timeFilter === 'all' ||
        (timeFilter === 'past' && isPast) ||
        (timeFilter === 'upcoming' && isUpcoming) ||
        (timeFilter === 'today' && isToday) ||
        (timeFilter === 'this-week' && isThisWeek);
      
      return matchesSearch && matchesCategory && matchesTime;
    })
    .sort((a, b) => {
      const now = new Date();
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      // Prioritize future events, then sort by closest to now
      const isPastA = dateA < now;
      const isPastB = dateB < now;

      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      
      return dateA - dateB;
    });
    
  // Extract unique categories for filter
  const categories = ['all', ...new Set(events.map(event => event.category).filter(Boolean))];

  // Loading state
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

  // Error state
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
        
        <div className="container mx-auto px-4 relative z-10">
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
          
          {/* Search and filters */}
          <motion.div 
            className="max-w-4xl mx-auto mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-100 dark:bg-emerald-700 text-emerald-800 dark:text-white rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-600 transition-colors w-full md:w-auto"
              >
                <Filter size={18} />
                <span>Filters</span>
                <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {filterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                    <select 
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select 
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
      
      <main className="container mx-auto px-4 py-12">
        {/* Event stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => new Date(e.startDate) > new Date()).length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Locations</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(events.map(e => e.location).filter(Boolean)).size}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => new Date(e.startDate).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" />
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

        {/* Results count */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'Event' : 'Events'} Found
          </h2>
          
          {(searchTerm || categoryFilter !== 'all' || timeFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTimeFilter('all');
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
            >
              Clear Filters
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <EventList 
            events={filteredAndSortedEvents} 
            apiBaseUrl={API_BASE_URL} 
            isLoading={loading}
          />
        </AnimatePresence>
        
        {/* No results message */}
        {filteredAndSortedEvents.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md mx-auto">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
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