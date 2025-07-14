/**
 * EnhancedArticleLayout Component
 * 
 * Reusable layout component for displaying full article content across
 * different content types (blogs, news, dairy content, etc). Provides
 * consistent presentation with reading progress indicator, sharing options,
 * related content, and ad placement.
 *
 * @module components/EnhancedArticleLayout
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import {
  Clock, ArrowLeft, Share2, Facebook, Instagram, MessageCircle,
  Bookmark, Heart, Mail
} from 'lucide-react';
import DynamicAdComponent from './DynamicAdComponent';
import API_ENDPOINTS from '../config/apiConfig';

/**
 * Import ad slot configurations with robust error handling
 * Uses a try-catch pattern to handle potential import errors
 */
let importedAdSlots;
try {
  const { adSlots } = require('./DynamicAdComponent');
  importedAdSlots = adSlots;
} catch (error) {
  console.warn('Failed to import adSlots:', error);
  importedAdSlots = null;
}

/**
 * Default ad slot configuration for fallback
 * Used when the imported configurations are unavailable
 */
const defaultAdSlots = {
  header: { slot: '1234567890', format: 'horizontal', style: { minHeight: '90px' } },
  inContent: { slot: '1122334455', format: 'rectangle', style: { minHeight: '200px' } }
};

/**
 * Safety-enhanced ad slot configuration
 * Implements multiple validation checks to ensure robust ad display
 */
const adSlots = importedAdSlots || {};
const safeAdSlots = {
  header: (adSlots?.header && typeof adSlots.header === 'object' && adSlots.header.slot) 
    ? adSlots.header 
    : defaultAdSlots.header,
  inContent: (adSlots?.inContent && typeof adSlots.inContent === 'object' && adSlots.inContent.slot) 
    ? adSlots.inContent 
    : defaultAdSlots.inContent
};

/**
 * Reusable component for rendering article content with standardized layout
 * 
 * @param {Object} props - Component props
 * @param {Object} props.article - The article object containing content and metadata
 * @param {boolean} props.loading - Loading state indicator
 * @param {string|null} props.error - Error message if article failed to load
 * @param {Array} props.recentPosts - Related content to display in sidebar
 * @param {string} props.backLink - URL to navigate back to article listing
 * @param {string} props.backLabel - Label for back navigation
 * @param {string} [props.category="Article"] - Content category label
 * @returns {JSX.Element} Rendered article layout
 */
const EnhancedArticleLayout = ({
  article,
  loading,
  error,
  recentPosts,
  backLink,
  backLabel,
  category = "Article"
}) => {
  // Router hooks
  const navigate = useNavigate();
  const alert = useAlert();
  
  // Reading and engagement state
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(article?.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Newsletter subscription state
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('all');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Subscription options
  const subscriptionOptions = [
    { value: 'all', label: 'All Updates', description: 'Get all our newsletters and updates' },
    { value: 'newsletters', label: 'Newsletters Only', description: 'Weekly farming insights and tips' },
    { value: 'events', label: 'Events', description: 'Upcoming farming events and workshops' },
    { value: 'auctions', label: 'Livestock Auctions', description: 'Auction announcements and schedules' },
    { value: 'farming-tips', label: 'Farming Tips', description: 'Expert advice and best practices' },
    { value: 'livestock-updates', label: 'Livestock Updates', description: 'Animal care and management news' }
  ];
  
  const articleRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const estimateReadTime = (content) => {
    if (!content) return '5 min read';
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article?.title || '';
    
    const shareUrls = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      instagram: '', // Instagram doesn't support direct URL sharing
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    };

    if (shareUrls[platform] && platform !== 'instagram') {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else if (platform === 'instagram') {
      // Instagram doesn't support direct URL sharing, so we'll copy the link
      navigator.clipboard.writeText(url);
      alert.success('Link copied to clipboard! You can now paste it in Instagram.');
    }
    setShowShareMenu(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Newsletter subscription handler
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setSubscriptionMessage('');
    setSubscriptionSuccess(false);
    setShowNotification(false);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscriptionEmail)) {
      setSubscriptionMessage('Please enter a valid email address.');
      setSubscriptionSuccess(false);
      setShowNotification(true);
      
      // Auto-hide error notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      return;
    }

    // Show preferences popup
    setShowPreferences(true);
  };

  const handleNewsletterSubscription = async () => {
    setSubscriptionLoading(true);
    setSubscriptionMessage('');
    setSubscriptionSuccess(false);
    setShowNotification(false);

    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_SUBSCRIBER, { 
        email: subscriptionEmail,
        subscriptionType: subscriptionType
      });
      
      setSubscriptionMessage(response.data.message || 'Thank you for subscribing! Welcome to our farming community.');
      setSubscriptionSuccess(true);
      setShowNotification(true);
      setSubscriptionEmail('');
      setSubscriptionType('all');
      setShowPreferences(false);
      
      // Auto-hide success notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      let errorMessage = 'Subscription failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your email address and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setSubscriptionMessage(errorMessage);
      setSubscriptionSuccess(false);
      setShowNotification(true);
      setShowPreferences(false);
      
      // Auto-hide error notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(backLink)}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {backLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Reading Progress Bar - Wired.com inspired */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-300 shadow-sm"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Modern Article Header - Copyblogger inspired */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(backLink)}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {backLabel}</span>
            </button>

            <div className="flex items-center space-x-6">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                {category}
              </span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{estimateReadTime(article.content)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Hero Section - Wired.com inspired */}
      <section className="relative bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                    Featured
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {formatDate(article.createdAt)}
                  </div>
                </div>

                <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                  {article.title}
                </h1>

                <div className="flex items-center space-x-8 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  {article.author && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-bold text-sm">
                          {article.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">By {article.author}</p>
                        <p className="text-xs text-gray-500">Agricultural Expert</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{estimateReadTime(article.content)}</span>
                    </div>
                    <span>•</span>
                    <span>{article.views || 0} views</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={`${API_BASE_URL}${article.imageUrl}`}
                  alt={article.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header Advertisement */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <DynamicAdComponent 
            adSlot={safeAdSlots.header.slot}
            adFormat={safeAdSlots.header.format}
            adStyle={safeAdSlots.header.style}
          />
        </div>
      </div>

      {/* Main Content - Enhanced Typography */}
      <main className="relative bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Article Content - Copyblogger inspired typography */}
            <article ref={articleRef} className="lg:col-span-8">
              {/* Top Article Ad */}
              <div className="mb-8">
                <DynamicAdComponent 
                  adSlot={safeAdSlots.inContent.slot}
                  adFormat={safeAdSlots.inContent.format}
                  adStyle={safeAdSlots.inContent.style}
                />
              </div>

              <div
                className="prose prose-xl max-w-none
                prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight prose-headings:leading-tight
                prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-lg prose-p:font-light prose-p:mb-6
                prose-a:text-green-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-green-700
                prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:bg-green-50 prose-blockquote:p-6 prose-blockquote:italic prose-blockquote:text-lg prose-blockquote:font-medium
                prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-gray-700 prose-li:leading-relaxed
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Bottom Article Ad */}
              <div className="mt-8">
                <DynamicAdComponent 
                  adSlot={safeAdSlots.inContent.slot}
                  adFormat={safeAdSlots.inContent.format}
                  adStyle={safeAdSlots.inContent.style}
                />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Newsletter Signup */}
              <div className="sticky top-8 space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Stay Updated</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get the latest farming insights delivered to your inbox
                    </p>
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      <input
                        type="email"
                        value={subscriptionEmail}
                        onChange={(e) => setSubscriptionEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        disabled={subscriptionLoading}
                      />
                      <button 
                        type="submit"
                        disabled={subscriptionLoading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subscriptionLoading ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    </form>

                    {/* Preferences Popup */}
                    {showPreferences && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Choose Your Preferences</h3>
                            <button
                              onClick={() => setShowPreferences(false)}
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
                                  name="subscriptionType"
                                  value={option.value}
                                  checked={subscriptionType === option.value}
                                  onChange={(e) => setSubscriptionType(e.target.value)}
                                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
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
                              onClick={() => setShowPreferences(false)}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleNewsletterSubscription}
                              disabled={subscriptionLoading}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {subscriptionLoading ? 'Subscribing...' : 'Subscribe'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Notification */}
                    {subscriptionMessage && showNotification && (
                      <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
                        subscriptionSuccess 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {subscriptionSuccess && (
                              <div className="flex items-center mb-2">
                                <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span className="font-medium">Success!</span>
                              </div>
                            )}
                            {!subscriptionSuccess && (
                              <div className="flex items-center mb-2">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="font-medium">Error</span>
                              </div>
                            )}
                            <p className="text-sm">{subscriptionMessage}</p>
                          </div>
                          <button 
                            onClick={() => setShowNotification(false)}
                            className={`ml-4 ${subscriptionSuccess ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Articles */}
                {recentPosts && recentPosts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">More Articles</h3>
                    <div className="space-y-4">
                      {recentPosts.slice(0, 3).map((post) => (
                        <Link
                          key={post._id}
                          to={`/blog/${post._id}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={`${API_BASE_URL}${post.imageUrl}`}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(post.createdAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Action Toolbar */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 hidden xl:block">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 space-y-3">
          <button
            onClick={handleLike}
            className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isLiked 
                ? 'bg-red-100 text-red-600 shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-md'
            }`}
            title="Like this article"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          <div className="text-center">
            <span className="text-xs font-medium text-gray-500">{likes}</span>
          </div>

          <button
            onClick={handleBookmark}
            className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isBookmarked 
                ? 'bg-blue-100 text-blue-600 shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-md transition-all duration-200"
              title="Share article"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {showShareMenu && (
              <div className="absolute left-full ml-3 top-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[140px]">
                <button
                  onClick={() => handleShare('x')}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm">X</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('instagram')}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span className="text-sm">Instagram</span>
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedArticleLayout;