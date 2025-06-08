import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin,
  BookOpen, X, Heart, MessageCircle, Bookmark, Eye, User, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedArticleLayout = ({ 
  article, 
  loading, 
  error, 
  recentPosts, 
  backLink, 
  backLabel,
  themeColor = "#2D5016",
  category = "Article"
}) => {
  const navigate = useNavigate();
  const [expandedImage, setExpandedImage] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(article?.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const articleRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (article?.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(article.content, 'text/html');
      const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
      const extractedHeadings = headingElements.map((heading, index) => ({
        id: `heading-${index}`,
        text: heading.textContent,
        level: heading.tagName.toLowerCase(),
      }));

      headingElements.forEach((heading, index) => {
        heading.id = `heading-${index}`;
      });

      setHeadings(extractedHeadings);
    }
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const articleHeight = articleRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const progress = (scrollPosition / (articleHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString) => new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(dateString));

  const estimateReadTime = (content) => {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  const handleShare = (platform = null) => {
    const shareUrl = window.location.href;
    const shareTitle = article?.title || 'Article';
    const shareText = article?.subtitle || article?.title || 'Check out this article';

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareText)}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(console.error);
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!')).catch(console.error);
        }
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder-image.jpg';
    e.target.alt = 'Image not available';
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-white flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-12 w-12 border-4 border-[#2D5016] border-t-transparent rounded-full"
      />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5DC] to-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-red-200"
      >
        <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Article</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to={backLink} className="text-[#2D5016] hover:underline font-medium">Return to {backLabel}</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#F5F5DC] to-white min-h-screen">
      {/* Reading Progress Bar */}
      <motion.div 
        style={{ width: `${readingProgress}%` }} 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#2D5016] to-[#DAA520] z-50"
        initial={{ width: 0 }}
        animate={{ width: `${readingProgress}%` }}
        transition={{ duration: 0.1 }}
      />

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <button 
              onClick={() => setExpandedImage(null)} 
              className="absolute top-4 right-4 text-white hover:text-[#DAA520] transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={`${API_BASE_URL}${expandedImage}`} 
              alt="Expanded" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg" 
              onError={handleImageError} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-3 space-y-6" ref={articleRef}>
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(backLink)}
              className="inline-flex items-center px-4 py-2 text-sm text-[#2D5016] hover:text-[#DAA520] transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to {backLabel}
            </motion.button>

            {/* Article Card */}
            <motion.article 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#2D5016]/10"
            >
              {/* Article Header */}
              <div className="p-8 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#2D5016] to-[#3D6B1F] text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                    {category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> 
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> 
                      {estimateReadTime(article.content)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" /> 
                      {article.views || 0} views
                    </span>
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-[#2D5016] mb-4 leading-tight">
                  {article.title}
                </h1>

                {article.subtitle && (
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {article.subtitle}
                  </p>
                )}

                {/* Author Info */}
                {article.author && (
                  <div className="flex items-center gap-3 mb-6 p-4 bg-[#F5F5DC] rounded-lg">
                    <div className="h-10 w-10 bg-[#2D5016] rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2D5016]">{article.author}</p>
                      <p className="text-sm text-gray-600">Agricultural Expert</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Image */}
              {article.imageUrl && (
                <div className="px-8 pb-6">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    src={`${API_BASE_URL}${article.imageUrl}`}
                    alt={article.title}
                    className="w-full rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setExpandedImage(article.imageUrl)}
                    onError={handleImageError}
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="px-8 pb-8">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-[#2D5016] prose-links:text-[#DAA520] prose-strong:text-[#2D5016]" 
                  dangerouslySetInnerHTML={{ __html: article.content }} 
                />

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-8 pt-6 border-t border-gray-200">
                    <Tag className="h-4 w-4 text-gray-500 mt-1" />
                    {article.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="bg-[#F5F5DC] text-[#2D5016] px-3 py-1 rounded-full text-sm font-medium hover:bg-[#2D5016] hover:text-white transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Article Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        isLiked 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{likes}</span>
                    </button>

                    <button 
                      onClick={handleBookmark}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        isBookmarked 
                          ? 'bg-[#DAA520] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-[#DAA520] hover:text-white'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">Save</span>
                    </button>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2D5016] text-white rounded-full hover:bg-[#3D6B1F] transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Share</span>
                    </button>

                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
                        >
                          <button 
                            onClick={() => handleShare('twitter')} 
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <Twitter className="h-4 w-4" /> Twitter
                          </button>
                          <button 
                            onClick={() => handleShare('facebook')} 
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <Facebook className="h-4 w-4" /> Facebook
                          </button>
                          <button 
                            onClick={() => handleShare('linkedin')} 
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <Linkedin className="h-4 w-4" /> LinkedIn
                          </button>
                          <button 
                            onClick={() => handleShare()} 
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            📋 Copy Link
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6 sticky top-20"
              >
                <h2 className="text-lg font-bold mb-4 text-[#2D5016] flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" /> 
                  Table of Contents
                </h2>
                <nav className="space-y-2">
                  {headings.map(heading => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F5F5DC] transition-colors ${
                        heading.level === 'h3' 
                          ? 'ml-4 text-gray-500' 
                          : 'text-[#2D5016] font-medium'
                      }`}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              </motion.div>
            )}

            {/* Recent Posts */}
            {recentPosts && recentPosts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-bold mb-4 text-[#2D5016]">Related Articles</h2>
                <div className="space-y-4">
                  {recentPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post._id}
                      to={`${backLink}/${post._id}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {post.imageUrl && (
                          <img
                            src={`${API_BASE_URL}${post.imageUrl}`}
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={handleImageError}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#2D5016] group-hover:text-[#DAA520] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EnhancedArticleLayout;
