import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  Facebook, 
  Instagram, 
  Copy,
  Check
} from 'lucide-react';
import useEngagement from '../hooks/useEngagement';

const EngagementPanel = ({ contentType, contentId, title, url }) => {
  const {
    stats,
    loading,
    toggleLike,
    trackShare,
    addComment
  } = useEngagement(contentType, contentId);

  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentForm, setCommentForm] = useState({
    author: '',
    email: '',
    content: ''
  });

  const handleLike = async () => {
    const newLikedState = await toggleLike(liked);
    setLiked(newLikedState);
  };

  const handleShare = async (platform) => {
    await trackShare();
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    };

    if (shareUrls[platform] && platform !== 'instagram') {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else if (platform === 'instagram') {
      // For Instagram, we'll copy the link since direct sharing isn't supported
      await copyLink();
    }
    
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      await trackShare();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addComment(commentForm.author, commentForm.email, commentForm.content);
      setCommentForm({ author: '', email: '', content: '' });
      setShowCommentForm(false);
      alert('Comment submitted successfully! It will appear after approval.');
    } catch (err) {
      alert('Failed to submit comment. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Engage with this content
      </h3>
      
      {/* Engagement Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {stats.views || 0}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {stats.likes || 0}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {stats.shares || 0}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            liked 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">
            {liked ? 'Liked' : 'Like'}
          </span>
        </motion.button>

        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </motion.button>

          {showShareMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-10 min-w-48"
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
                  onClick={() => handleShare('x')}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm">X (Twitter)</span>
                </button>
                
                <button
                  onClick={() => handleShare('instagram')}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 text-left"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span className="text-sm">Instagram</span>
                </button>
                
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-left"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">WhatsApp</span>
                </button>
                
                <button
                  onClick={copyLink}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Comment</span>
        </motion.button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleCommentSubmit}
          className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={commentForm.author}
                onChange={(e) => setCommentForm(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={commentForm.email}
                onChange={(e) => setCommentForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comment
            </label>
            <textarea
              required
              rows={4}
              value={commentForm.content}
              onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your thoughts..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Comment'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Comments are moderated and will appear after approval.
          </p>
        </motion.form>
      )}
    </div>
  );
};

export default EngagementPanel;
