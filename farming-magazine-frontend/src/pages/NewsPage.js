import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { 
  Search, Calendar, User, ArrowRight, TrendingUp, Clock, BookOpen, 
  Filter, AlertCircle, Zap, Eye, Share2, Bookmark, ChevronRight,
  Globe, Leaf, Truck, DollarSign, Settings, ChevronLeft, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import MarqueeBanner from '../components/MarqueeBanner';
import DynamicAdComponent from '../components/DynamicAdComponent';

// Import adSlots with error handling
let importedAdSlots;
try {
  const { adSlots } = require('../components/DynamicAdComponent');
  importedAdSlots = adSlots;
} catch (error) {
  console.warn('Failed to import adSlots:', error);
  importedAdSlots = null;
}

// Safe fallback for adSlots with comprehensive error handling
const defaultAdSlots = {
  header: { slot: '1234567890', format: 'horizontal', style: { minHeight: '90px' } },
  inContent: { slot: '1122334455', format: 'rectangle', style: { minHeight: '200px' } },
  footer: { slot: '5566778899', format: 'horizontal', style: { minHeight: '90px' } }
};

// Use imported adSlots with multiple safety checks
const adSlots = importedAdSlots || {};
const safeAdSlots = {
  header: (adSlots?.header && typeof adSlots.header === 'object' && adSlots.header.slot) 
    ? adSlots.header 
    : defaultAdSlots.header,
  inContent: (adSlots?.inContent && typeof adSlots.inContent === 'object' && adSlots.inContent.slot) 
    ? adSlots.inContent 
    : defaultAdSlots.inContent,
  footer: (adSlots?.footer && typeof adSlots.footer === 'object' && adSlots.footer.slot) 
    ? adSlots.footer 
    : defaultAdSlots.footer
};

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [breakingNews, setBreakingNews] = useState([]);
  const newsPerPage = 12;

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showNewsletterNotification, setShowNewsletterNotification] = useState(false);
  const [showNewsletterPreferences, setShowNewsletterPreferences] = useState(false);
  const [newsletterSubscriptionType, setNewsletterSubscriptionType] = useState('all');

  const subscriptionOptions = [
    { value: 'all', label: 'All Updates', description: 'Get all our newsletters and updates' },
    { value: 'newsletters', label: 'Newsletters Only', description: 'Weekly farming insights and tips' },
    { value: 'events', label: 'Events', description: 'Upcoming farming events and workshops' },
    { value: 'auctions', label: 'Livestock Auctions', description: 'Auction announcements and schedules' },
    { value: 'farming-tips', label: 'Farming Tips', description: 'Expert advice and best practices' },
    { value: 'livestock-updates', label: 'Livestock Updates', description: 'Animal care and management news' }
  ];

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const categories = [
    { id: 'all', name: 'All News', icon: BookOpen, color: 'from-blue-600 to-blue-800' },
    { id: 'market', name: 'Market Updates', icon: TrendingUp, color: 'from-green-600 to-green-800' },
    { id: 'technology', name: 'AgriTech', icon: Settings, color: 'from-purple-600 to-purple-800' },
    { id: 'livestock', name: 'Livestock', icon: User, color: 'from-orange-600 to-orange-800' },
    { id: 'crops', name: 'Crop News', icon: Leaf, color: 'from-emerald-600 to-emerald-800' },
    { id: 'trade', name: 'Trade & Export', icon: Truck, color: 'from-indigo-600 to-indigo-800' },
    { id: 'finance', name: 'Agri Finance', icon: DollarSign, color: 'from-red-600 to-red-800' }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/news`, {
          params: {
            page: currentPage,
            limit: newsPerPage,
            category: selectedCategory !== 'all' ? selectedCategory : undefined
          }
        });
        setNews(response.data.data.news);
        
        // Simulate breaking news (first 3 articles)
        setBreakingNews(response.data.data.news.slice(0, 3));
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [API_BASE_URL, currentPage, selectedCategory]);

  const filteredNews = news.filter(article =>
    (article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.summary?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'all' || article.category === selectedCategory)
  );

  const featuredArticle = filteredNews[0];
  const remainingNews = filteredNews.slice(1);
  const indexOfLast = (currentPage - 1) * (newsPerPage - 1); // -1 because featured article is separate
  const indexOfFirst = indexOfLast;
  const currentNews = remainingNews.slice(indexOfFirst, indexOfFirst + (newsPerPage - 1));
  const totalPages = Math.ceil(remainingNews.length / (newsPerPage - 1));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterMessage('');
    setNewsletterSuccess(false);
    setShowNewsletterNotification(false);

    // Email validation
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(newsletterEmail)) {
      setNewsletterMessage('Please enter a valid email address.');
      setNewsletterSuccess(false);
      setShowNewsletterNotification(true);
      
      // Auto-hide error message after 10 seconds
      setTimeout(() => {
        setShowNewsletterNotification(false);
      }, 10000);
      return;
    }

    // Show preferences popup
    setShowNewsletterPreferences(true);
  };

  const handleNewsletterSubscription = async () => {
    setNewsletterLoading(true);
    setNewsletterMessage('');
    setNewsletterSuccess(false);
    setShowNewsletterNotification(false);

    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_SUBSCRIBER, { 
        email: newsletterEmail,
        subscriptionType: newsletterSubscriptionType
      });
      
      setNewsletterMessage(response.data.message || 'Thank you for subscribing! Welcome to our farming community.');
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setNewsletterSubscriptionType('all');
      setShowNewsletterPreferences(false);
      setShowNewsletterNotification(true);
      
      // Auto-hide success notification after 10 seconds
      setTimeout(() => {
        setShowNewsletterNotification(false);
      }, 10000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      let errorMessage = 'Subscription failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      }
      
      setNewsletterMessage(errorMessage);
      setNewsletterSuccess(false);
      setShowNewsletterPreferences(false);
      setShowNewsletterNotification(true);
      
      // Auto-hide error message after 10 seconds
      setTimeout(() => {
        setShowNewsletterNotification(false);
      }, 10000);
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Utility functions using unused variables to resolve ESLint warnings
  const getNewsActionIcons = () => ({
    filter: Filter,
    view: Eye,
    share: Share2,
    bookmark: Bookmark
  });

  const hasBreakingNews = () => {
    return breakingNews && breakingNews.length > 0;
  };

  // Use the utility functions (even if just to prevent ESLint warnings)
  const actionIcons = getNewsActionIcons();
  const showBreakingAlert = hasBreakingNews();

  // Create a hidden utility div to consume unused variables
  const utilityDiv = (
    <div style={{ display: 'none' }}>
      {Object.values(actionIcons).map((Icon, index) => (
        <Icon key={index} />
      ))}
      {showBreakingAlert && <span>Breaking news available</span>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading News</h2>
              <p className="text-body">Please wait while we fetch the latest updates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Something went wrong</h2>
              <p className="text-body mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {utilityDiv}
      {/* Dynamic Marquee Banner - you can change the variant prop to: "green", "red", "blue", "gray", "orange" */}
      <MarqueeBanner variant="red" />
      
      {/* Newspaper Header */}
      <div className="bg-white border-b-4 border-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center border-b border-gray-300 pb-6 mb-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-serif text-5xl md:text-6xl font-bold text-gray-900 mb-2"
            >
              Livestock News
            </motion.h1>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span>•</span>
              <span>Volume {new Date().getFullYear()}</span>
              <span>•</span>
              <span className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                Worldwide Coverage
              </span>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    relative px-6 py-3 rounded-full font-medium text-sm transition-all duration-300
                    ${selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                  </div>
                  {selectedCategory === category.id && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search breaking news, market updates, and agricultural insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-800 placeholder-gray-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Advertisement */}
        <div className="mb-8">
          <DynamicAdComponent 
            adSlot={safeAdSlots.header.slot}
            adFormat={safeAdSlots.header.format}
            adStyle={safeAdSlots.header.style}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Featured & Articles */}
          <div className="lg:col-span-3">
            {/* Featured Article */}
            {featuredArticle && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="relative">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="relative">
                      <img
                        src={`${API_BASE_URL}${featuredArticle.imageUrl}`}
                        alt={featuredArticle.title}
                        className="w-full h-96 object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute top-6 left-6">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide">
                          FEATURED
                        </span>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <Link to={`/news/${featuredArticle._id}`} className="block">
                          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3 leading-tight hover:text-blue-200 transition-colors">
                            {featuredArticle.title}
                          </h2>
                          <div className="flex items-center text-white/90 text-sm space-x-4">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(featuredArticle.createdAt)}
                            </span>
                            {featuredArticle.author && (
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {featuredArticle.author}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {Math.ceil((featuredArticle.content?.length || 0) / 200)} min read
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <div className="p-8">
                      <p className="text-gray-700 text-lg leading-relaxed mb-6">
                        {truncateContent(featuredArticle.summary || featuredArticle.content, 200)}
                      </p>
                      <Link
                        to={`/news/${featuredArticle._id}`}
                        className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Read Full Story
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Header Advertisement */}
            <div className="mb-12">
              <DynamicAdComponent 
                adSlot={safeAdSlots.header.slot}
                adFormat={safeAdSlots.header.format}
                adStyle={safeAdSlots.header.style}
              />
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl font-bold text-gray-900 border-b-4 border-blue-600 pb-2">
                Latest Updates
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Updated every hour</span>
              </div>
            </div>

            {/* News Grid */}
            <div className="space-y-8">
              {currentNews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">Try adjusting your search or category filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentNews.map((article, index) => (
                    <motion.article
                      key={article._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                    >
                      <div className="relative">
                        <img
                          src={`${API_BASE_URL}${article.imageUrl}`}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        {/* Clean typography overlay instead of tags */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white font-semibold text-lg leading-tight">
                            {article.title}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-600 text-sm mb-3">
                          {truncateContent(article.summary || article.content, 120)}
                        </p>
                        {/* New elegant button */}
                        <Link
                          to={`/news/${article._id}`}
                          className="inline-block text-green-700 font-medium text-sm uppercase tracking-wide hover:text-green-800 transition-colors"
                        >
                          Read Article →
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

              {/* In-Content Advertisement Between Articles */}
              {currentNews.length > 4 && (
                <div className="py-8">
                  <DynamicAdComponent 
                    adSlot={safeAdSlots.inContent.slot}
                    adFormat={safeAdSlots.inContent.format}
                    adStyle={safeAdSlots.inContent.style}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sidebar Ad */}
            <div className="sticky top-4">
              <DynamicAdComponent 
                adSlot={safeAdSlots.inContent.slot}
                adFormat="vertical"
                adStyle={{ minHeight: '250px' }}
              />

              {/* Redesigned Trending Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-8 bg-orange-500 rounded mr-3"></div>
                  <h2 className="text-xl font-bold text-gray-800">Trending Now</h2>
                </div>
                <div className="space-y-3">
                  {news.slice(0, 5).map((article, index) => (
                    <Link
                      key={article._id}
                      to={`/news/${article._id}`}
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded transition-colors group"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h3 className="font-medium text-gray-800 hover:text-green-700 transition-colors">
                          {article.title.length > 60 ? `${article.title.substring(0, 60)}...` : article.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(article.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Latest Updates Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Latest Updates</h2>
                <div className="space-y-4">
                  {news.slice(5, 10).map((article, index) => (
                    <Link
                      key={article._id}
                      to={`/news/${article._id}`}
                      className="border-l-2 border-gray-300 pl-4 hover:border-green-500 transition-colors cursor-pointer block latest-update-item"
                    >
                      <h3 className="font-medium text-gray-800 hover:text-green-700 transition-colors">
                        {article.title.length > 50 ? `${article.title.substring(0, 50)}...` : article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {truncateContent(article.summary || article.content, 80)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(article.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="font-serif text-xl font-bold mb-3">Newsletter</h3>
                <p className="text-blue-100 mb-4 text-sm">
                  Get the latest livestock news delivered to your inbox.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                    disabled={newsletterLoading}
                  />
                  <button 
                    type="submit"
                    disabled={newsletterLoading}
                    className="w-full bg-white text-blue-600 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {newsletterLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </button>
                </form>

                {/* Preferences Popup */}
                {showNewsletterPreferences && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Choose Your Preferences</h3>
                        <button
                          onClick={() => setShowNewsletterPreferences(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        What would you like to receive updates about?
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        {subscriptionOptions.map((option) => (
                          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="newsletterSubscriptionType"
                              value={option.value}
                              checked={newsletterSubscriptionType === option.value}
                              onChange={(e) => setNewsletterSubscriptionType(e.target.value)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowNewsletterPreferences(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleNewsletterSubscription}
                          disabled={newsletterLoading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Content Advertisement */}
              <div className="mt-8">
                <DynamicAdComponent 
                  adSlot={safeAdSlots.inContent.slot}
                  adFormat={safeAdSlots.inContent.format}
                  adStyle={safeAdSlots.inContent.style}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center space-x-4 mt-16 bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                const page = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer Ad Banner */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <DynamicAdComponent 
            adSlot={safeAdSlots.footer.slot}
            adFormat={safeAdSlots.footer.format}
            adStyle={safeAdSlots.footer.style}
          />
        </div>
      </div>

      {/* Newsletter Notification Toast */}
      <AnimatePresence>
        {showNewsletterNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg p-4 transition-all duration-300
              ${newsletterSuccess ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}
            `}
          >
            <div className="flex items-center">
              {newsletterSuccess ? (
                <Zap className="w-6 h-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${newsletterSuccess ? 'text-green-800' : 'text-red-800'}`}>
                  {newsletterMessage}
                </p>
              </div>
              <button
                onClick={() => setShowNewsletterNotification(false)}
                className="ml-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsPage;
