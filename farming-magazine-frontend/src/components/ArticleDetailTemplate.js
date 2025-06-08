import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin,
  X, Eye, User, Tag as TagIcon, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TableOfContents from './TableOfContents';
import EngagementPanel from './EngagementPanel';
import RecentPosts from './RecentPosts';
import RelatedContent from './RelatedContent';
import ReadingProgress from './ReadingProgress';
import EnhancedSEO from './EnhancedSEO';
import LazyImage from './LazyImage';

const ArticleDetailTemplate = ({
  article,
  contentType,
  loading,
  error,
  headings,
  recentPosts,
  relatedPosts,
  backPath,
  backLabel,
  onImageClick,
  expandedImage,
  onCloseImage
}) => {
  const navigate = useNavigate();
  const articleRef = useRef(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Estimate read time based on content length
  const estimateReadTime = (content) => {
    if (!content) return '1 min read';
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  };

  // Handle social sharing
  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = article?.title || '';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy URL:', err);
        }
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(false);
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/placeholder-image.jpg';
  };

  if (loading) {
    return (
      <div className="article-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-container">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Article not found'}
          </h1>
          <Link to={backPath} className="back-button">
            <ArrowLeft className="h-4 w-4" />
            Back to {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <EnhancedSEO
        title={`${article.title} | ${backLabel}`}
        description={article.subtitle || article.summary || article.description}
        keywords={article.tags || []}
        image={article.imageUrl ? `${API_BASE_URL}${article.imageUrl}` : null}
        url={window.location.pathname}
        type="article"
        article={{
          author: article.author,
          publishedAt: article.publishedAt || article.createdAt,
          updatedAt: article.updatedAt,
          category: article.category || contentType,
          tags: article.tags,
          wordCount: article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
          readTime: `PT${Math.max(1, Math.ceil((article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0) / 200))}M`
        }}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: backLabel, url: backPath },
          { name: article.title, url: window.location.pathname }
        ]}
      />
      
      <ReadingProgress targetRef={articleRef} />
      
      <div className="article-container">
        {/* Navigation */}
        <div className="article-navigation">
          <Link to={backPath} className="back-button">
            <ArrowLeft className="h-4 w-4" />
            Back to {backLabel}
          </Link>
          
          <div className="share-buttons">
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="share-button"
                aria-label="Share article"
              >
                <Share2 className="h-4 w-4" />
              </button>
              
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-10 min-w-48"
                  >
                    <div className="space-y-2">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-left"
                      >
                        <Twitter className="w-4 h-4 text-sky-600" />
                        <span className="text-sm">Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left"
                      >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        <span className="text-sm">LinkedIn</span>
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="article-layout">
          {/* Main Content */}
          <div className="article-main">
            {/* Article Header */}
            <motion.article
              ref={articleRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="article-header"
            >
              <div className="space-y-6">
                <h1 className="article-title">{article.title}</h1>
                
                <div className="article-meta">
                  <span className="article-meta-item">
                    <Calendar className="h-4 w-4" />
                    {formatDate(article.publishedAt || article.createdAt)}
                  </span>
                  <span className="article-meta-item">
                    <Clock className="h-4 w-4" />
                    {estimateReadTime(article.content)}
                  </span>
                  {article.author && (
                    <span className="article-meta-item">
                      <User className="h-4 w-4" />
                      {article.author}
                    </span>
                  )}
                  {article.views && (
                    <span className="article-meta-item">
                      <Eye className="h-4 w-4" />
                      {article.views} views
                    </span>
                  )}
                </div>

                {article.imageUrl && (
                  <LazyImage
                    src={`${API_BASE_URL}${article.imageUrl}`}
                    alt={article.title}
                    className="article-image"
                    onClick={() => onImageClick && onImageClick(article.imageUrl)}
                    onError={handleImageError}
                    placeholder="/images/placeholder-image.jpg"
                    loading="lazy"
                  />
                )}

                {(article.subtitle || article.description) && (
                  <p className="text-lg text-neutral-700 dark:text-gray-300 italic leading-relaxed">
                    {article.subtitle || article.description}
                  </p>
                )}
                
                <div 
                  className="article-content" 
                  dangerouslySetInnerHTML={{ __html: article.content }} 
                />

                {article.tags && article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map((tag, i) => (
                      <span key={i} className="article-tag">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>

            {/* Related Content */}
            {relatedPosts && relatedPosts.length > 0 && (
              <RelatedContent 
                currentContent={article}
                contentType={contentType}
                className="mt-8"
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="article-sidebar">
            {headings && headings.length > 0 && (
              <TableOfContents headings={headings} />
            )}
            
            <EngagementPanel 
              contentType={contentType}
              contentId={article._id}
              title={article.title}
              url={window.location.href}
            />
            
            {recentPosts && recentPosts.length > 0 && (
              <RecentPosts 
                posts={recentPosts} 
                themeColor="#1B4332"
                contentType={contentType}
              />
            )}
          </aside>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onCloseImage}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`${API_BASE_URL}${expandedImage}`}
                alt={article.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <button
                onClick={onCloseImage}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ArticleDetailTemplate;
