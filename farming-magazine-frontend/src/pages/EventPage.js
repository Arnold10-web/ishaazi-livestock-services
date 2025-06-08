import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Loader2, Calendar, MapPin, Search, Filter, ChevronDown, 
  Users, Star, Grid3X3, List,
  Heart, TrendingUp, Sparkles, BarChart3
} from 'lucide-react';
import EventList from '../components/EventList';
import EventRegistrationModal from '../components/EventRegistrationModal';
import Footer from '../components/Footer';

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const eventsPerPage = 9;
  
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = (registrationData) => {
    // You can add success notification here
    console.log('Registration successful:', registrationData);
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEvents.length / eventsPerPage);
  const currentEvents = filteredAndSortedEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  // Stats data
  const stats = [
    { 
      icon: Calendar, 
      label: 'Total Events', 
      value: events.length.toString(),
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      icon: TrendingUp, 
      label: 'Upcoming Events', 
      value: events.filter(e => new Date(e.startDate) > new Date()).length.toString(),
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: MapPin, 
      label: 'Locations', 
      value: new Set(events.map(e => e.location).filter(Boolean)).size.toString(),
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: Users, 
      label: 'This Week', 
      value: events.filter(e => {
        const eventDate = new Date(e.startDate);
        const now = new Date();
        return eventDate >= now && eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }).length.toString(),
      color: 'from-orange-500 to-red-500'
    }
  ];
    
  // Extract unique categories for filter
  const categories = ['all', ...new Set(events.map(event => event.category).filter(Boolean))];

  // Loading state with glassmorphism
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Loader2 className="w-full h-full text-emerald-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Events</h3>
          <p className="text-gray-600">Discovering amazing farming events for you...</p>
        </motion.div>
      </div>
    );
  }

  // Error state with glassmorphism
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-medium"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Enhanced Hero Section */}
      <motion.div 
        style={{ y: headerY, opacity }}
        className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-20 overflow-hidden"
      >
        {/* Dynamic background with floating particles */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 backdrop-blur-sm"></div>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20"
            >
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-100 font-medium">Discover Amazing Events</span>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent leading-tight"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Farming
              <motion.span 
                className="inline-block mx-3"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              >
                <Heart className="w-16 h-16 md:w-20 md:h-20 text-red-400 inline" fill="currentColor" />
              </motion.span>
              Events
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Connect with the farming community through workshops, conferences, and networking events. 
              Learn, grow, and share knowledge with fellow agricultural enthusiasts.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <button className="group bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white border border-white/30 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 group-hover:animate-bounce" />
                  Browse All Events
                </span>
              </button>
              <button className="group bg-gradient-to-r from-white/10 to-white/20 backdrop-blur-lg hover:from-white/20 hover:to-white/30 text-white border border-white/30 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 group-hover:animate-pulse" />
                  Host an Event
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg 
            viewBox="0 0 1440 120" 
            fill="none" 
            className="w-full h-20 text-white"
          >
            <motion.path 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
              fill="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Enhanced Stats Section */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative -mt-10 z-20 px-4"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 mb-2">{stat.value}</div>
                    <div className="text-slate-600 font-semibold text-sm">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        {/* Enhanced Search and Filter Section */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white/30 backdrop-blur-lg rounded-3xl border border-white/50 p-6 shadow-2xl mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-2xl p-1 border border-white/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <List className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Enhanced Filter Button */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  filterOpen
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 border border-white/50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <AnimatePresence>
                {filterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl z-20 p-6 border border-white/50"
                  >
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Time Filter</label>
                        <select 
                          value={timeFilter}
                          onChange={(e) => setTimeFilter(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700"
                        >
                          <option value="all">All Events</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="today">Today</option>
                          <option value="this-week">This Week</option>
                          <option value="past">Past Events</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                        <select 
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Results Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-2 text-gray-600">
            <BarChart3 className="w-5 h-5" />
            <span>
              Showing {currentEvents.length} of {filteredAndSortedEvents.length} events
              {searchTerm && ` for "${searchTerm}"`}
            </span>
          </div>
          {filteredAndSortedEvents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Star className="w-4 h-4 text-yellow-500" />
              Quality events curated by experts
            </div>
          )}
          
          {(searchTerm || categoryFilter !== 'all' || timeFilter !== 'all') && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setTimeFilter('all');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
            >
              Clear Filters
            </motion.button>
          )}
        </motion.div>

        {/* Enhanced Event List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${viewMode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <EventList 
              events={currentEvents} 
              apiBaseUrl={API_BASE_URL} 
              isLoading={loading}
              onRegisterClick={handleRegisterClick}
              viewMode={viewMode}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center items-center gap-2 mt-12"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentPage(page)}
                className={`w-12 h-12 rounded-2xl font-semibold transition-all duration-300 ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 border border-white/50'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </motion.div>
        )}
        
        {/* Enhanced No Results Message */}
        {filteredAndSortedEvents.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 max-w-md mx-auto border border-white/50">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No events found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any events matching your search criteria. Try adjusting your filters or check back later for new events.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTimeFilter('all');
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-medium"
              >
                View All Events
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Enhanced Event Registration Modal */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={registrationModalOpen}
        onClose={() => {
          setRegistrationModalOpen(false);
          setSelectedEvent(null);
        }}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      {/* Enhanced Footer */}
      <Footer />
    </div>
  );
};

export default EventPage;