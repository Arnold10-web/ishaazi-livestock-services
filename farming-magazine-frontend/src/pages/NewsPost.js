/**
 * NewsPost Page Component
 * 
 * Individual news article display page that shows the complete content 
 * of a farming news article with related articles, sharing options,
 * and engagement features.
 * 
 * @module pages/NewsPost
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Calendar, Clock, User, Share2, Bookmark, Eye, ArrowLeft,
  Facebook, Instagram, MessageCircle, 
  ChevronRight, Tag, Globe
} from 'lucide-react';
import DynamicAdComponent from '../components/DynamicAdComponent';

/**
 * Renders a complete news article with metadata and related content
 * 
 * @returns {JSX.Element} Rendered news post page
 */
const NewsPost = () => {
  // Router hooks for navigation and parameters
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentNews, setRecentNews] = useState([]);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Fetch news article and related content
   * Loads both the current article and a set of recent articles for the sidebar
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get the current article data
        const res = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        const data = res.data.data;
        setNews(data);

        // Get recent articles for related content section, excluding current article
        const recent = await axios.get(`${API_BASE_URL}/api/content/news?limit=4`);
        setRecentNews(recent.data.data.news.filter(n => n._id !== id));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load the article.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Scroll to top when article changes
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  // User interaction state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  /**
   * Check for bookmarked status in local storage when article changes
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        const data = res.data.data;

        setNews(data);

        const recent = await axios.get(`${API_BASE_URL}/api/content/news?limit=6`);
        setRecentNews(recent.data.data.news.filter(n => n._id !== id));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load the article.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = news?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy the link
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard! You can now paste it in Instagram.');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        break;
    }
    setShareOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Article</h2>
          <p className="text-gray-500">Please wait while we fetch the content...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/news"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/news')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShareOpen(!shareOpen)}
                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
                  >
                    <div className="py-2">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Facebook className="w-4 h-4 mr-3 text-blue-600" />
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('x')}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Globe className="w-4 h-4 mr-3 text-gray-900" />
                        X
                      </button>
                      <button
                        onClick={() => handleShare('instagram')}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Instagram className="w-4 h-4 mr-3 text-pink-600" />
                        Instagram
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare()}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Globe className="w-4 h-4 mr-3 text-gray-600" />
                        Copy Link
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article */}
          <div className="lg:col-span-3">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Article Header */}
              <div className="relative">
                {news.imageUrl && (
                  <img
                    src={`${API_BASE_URL}${news.imageUrl}`}
                    alt={news.title}
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  {news.category && (
                    <span className="inline-block bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide mb-4">
                      {news.category.toUpperCase()}
                    </span>
                  )}
                  <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight">
                    {news.title}
                  </h1>
                </div>
              </div>

              {/* Article Meta */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-6 text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(news.createdAt)}
                    </span>
                    {news.author && (
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {news.author}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {Math.ceil((news.content?.length || 0) / 200)} min read
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {news.views || 0} views
                    </span>
                    <span className="flex items-center text-orange-500">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Trending
                    </span>
                  </div>
                </div>
              </div>

              {/* Article Summary */}
              {news.summary && (
                <div className="p-8 bg-blue-50 border-b border-gray-200">
                  <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">Summary</h2>
                  <p className="text-gray-700 text-lg leading-relaxed italic">
                    {news.summary}
                  </p>
                </div>
              )}

              {/* Article Content */}
              <div className="p-8">
                <div 
                  className="prose prose-lg max-w-none
                    prose-headings:font-serif prose-headings:text-gray-900
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:text-gray-700 prose-ol:text-gray-700
                    prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-blockquote:py-2
                    prose-img:rounded-lg prose-img:shadow-lg"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              </div>

              {/* Tags */}
              {news.tags && news.tags.length > 0 && (
                <div className="px-8 pb-8">
                  <div className="flex items-center flex-wrap gap-2 pt-6 border-t border-gray-200">
                    <Tag className="w-4 h-4 text-gray-500 mr-2" />
                    {news.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.article>

            {/* Content Ad */}
            <div className="my-8">
              <DynamicAdComponent 
                adSlot="1122334455"
                adFormat="rectangle"
                adStyle={{ minHeight: '200px' }}
              />
            </div>

            {/* Related Articles */}
            {recentNews.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mt-8"
              >
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6 border-b-4 border-blue-600 pb-2 inline-block">
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentNews.slice(0, 4).map((article) => (
                    <Link
                      key={article._id}
                      to={`/news/${article._id}`}
                      className="group block"
                    >
                      <div className="flex space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                        {article.imageUrl && (
                          <img
                            src={`${API_BASE_URL}${article.imageUrl}`}
                            alt={article.title}
                            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight mb-1">
                            {article.title.length > 80 ? `${article.title.substring(0, 80)}...` : article.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Ad Banner */}
              <DynamicAdComponent 
                adSlot="5566778899"
                adFormat="vertical"
                adStyle={{ minHeight: '250px' }}
              />

              {/* Latest News */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">
                  Latest News
                </h3>
                <div className="space-y-4">
                  {recentNews.slice(0, 5).map((article, index) => (
                    <Link
                      key={article._id}
                      to={`/news/${article._id}`}
                      className="block group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">
                            {article.title.length > 60 ? `${article.title.substring(0, 60)}...` : article.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
                <h3 className="font-serif text-xl font-bold mb-3">Daily Digest</h3>
                <p className="text-green-100 mb-4 text-sm">
                  Get agricultural insights delivered to your inbox every morning.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <button className="w-full bg-white text-green-600 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>

              {/* Sidebar Ad */}
              <DynamicAdComponent 
                adSlot="5566778899"
                adFormat="vertical"
                adStyle={{ minHeight: '250px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPost;