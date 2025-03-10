import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, Image, Video, Music } from 'lucide-react';

const BasicList = ({
  basics = [],
  apiBaseUrl,
  isAdmin,
  onDelete,
  onEdit,
  onDeleteComment,
  onAddComment,
  isLoading
}) => {
  const [newComment, setNewComment] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  const [loadedMedia, setLoadedMedia] = useState({});
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Use local placeholders that are guaranteed to be in your public folder
  const PLACEHOLDER_IMAGE = '/placeholder-media.jpg';

  // Simple error handler for images
  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  // Media URL helper function with proper error handling
  const getMediaUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    
    try {
      // If the URL already starts with http:// or https:// or // (protocol-relative URL), return it as is
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        return url;
      }
      
      // Otherwise, prepend the API base URL
      const baseUrl = apiBaseUrl || 'https://ishaazi-livestock-services-production.up.railway.app';
      const baseUrlWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const urlWithLeadingSlash = url.startsWith('/') ? url : `/${url}`;
      
      return `${baseUrlWithoutTrailingSlash}${urlWithLeadingSlash}`;
    } catch (error) {
      console.error('Error processing media URL:', error);
      return PLACEHOLDER_IMAGE;
    }
  };

  // Mark media as loaded to prevent flickering
  const handleMediaLoad = (id, mediaType = 'image') => {
    if (isMounted.current) {
      setLoadedMedia(prev => ({...prev, [id]: mediaType}));
    }
  };

  // Mark media as errored without causing re-render loops
  const handleMediaError = (e, id, mediaType = 'image') => {
    e.preventDefault(); // Prevent default error behavior
    console.error(`Media failed to load for item ${id}:`, e.target.src || e.target.currentSrc);
    
    if (!mediaErrors[id] && isMounted.current) {
      setMediaErrors(prev => {
        if (prev[id]) return prev;
        return {...prev, [id]: mediaType};
      });
    }
  };

  // Dedicated error handler for video
  const handleVideoError = (e, id) => {
    console.error(`Video failed to load for item ${id}:`, e.target.src || e.target.currentSrc);
    
    if (isMounted.current) {
      setMediaErrors(prev => ({...prev, [id]: 'video'}));
    }
  };

  // Dedicated error handler for audio
  const handleAudioError = (e, id) => {
    console.error(`Audio failed to load for item ${id}:`, e.target.src || e.target.currentSrc);
    
    if (isMounted.current) {
      setMediaErrors(prev => ({...prev, [id]: 'audio'}));
    }
  };

  // Truncate long descriptions
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    
    if (typeof content === 'string') {
      return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
    }
    
    // Handle HTML content safely
    try {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = String(content);
      let text = tempElement.textContent || tempElement.innerText;
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    } catch (error) {
      console.error('Error truncating content:', error);
      return '';
    }
  };

  // Format dates with error handling
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Update the comment state for a specific Basic item
  const handleCommentChange = (basicId, content) => {
    setNewComment((prev) => ({ ...prev, [basicId]: content }));
  };

  // Submit a new comment for a specific Basic item
  const handleCommentSubmit = (basicId) => {
    const content = newComment[basicId]?.trim();
    if (content && onAddComment) {
      onAddComment(basicId, content);
      setNewComment((prev) => ({ ...prev, [basicId]: '' }));
    }
  };

  // Skeleton loader with shimmer effect for loading state
  const BasicSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-sm p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
        </div>
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );

  // Empty state with animation when no basics are available
  if (basics.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          <AlertCircle className="w-16 h-16 text-blue-400/80" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-semibold text-gray-800">No Media Available</h3>
        <p className="mt-2 text-gray-600">Check back soon for updates!</p>
      </motion.div>
    );
  }

  // Loading state with a skeleton grid
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {[1, 2].map((i) => (
          <BasicSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Media placeholder components for better fallbacks
  const ImagePlaceholder = ({title}) => (
    <div className="bg-gray-100 h-64 flex items-center justify-center rounded-t-xl">
      <div className="text-center p-4">
        <Image className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Image not available</p>
        <p className="text-xs text-gray-400">{title || "Media"}</p>
      </div>
    </div>
  );

  const VideoPlaceholder = ({title}) => (
    <div className="bg-gray-100 aspect-video flex items-center justify-center rounded">
      <div className="text-center p-4">
        <Video className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Video not available</p>
        <p className="text-xs text-gray-400">{title || "Media"}</p>
      </div>
    </div>
  );

  const AudioPlaceholder = ({title}) => (
    <div className="bg-gray-100 p-4 flex items-center justify-center rounded">
      <div className="text-center">
        <Music className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Audio not available</p>
        <p className="text-xs text-gray-400">{title || "Media"}</p>
      </div>
    </div>
  );

  return (
    <div className="basic-list container mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {basics.map((basic, index) => (
          <motion.article
            key={basic._id || `basic-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="basic-item bg-white rounded-xl shadow-sm overflow-hidden mb-6"
          >
            {/* Image Section */}
            {basic.imageUrl && (
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {mediaErrors[basic._id]?.includes('image') ? (
                  <ImagePlaceholder title={basic.title} />
                ) : (
                  <motion.img
                    src={getMediaUrl(basic.imageUrl)}
                    alt={basic.title || "Media"}
                    onError={(e) => handleMediaError(e, basic._id, 'image')}
                    onLoad={() => handleMediaLoad(basic._id, 'image')}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            )}
            
            {/* Basic Details */}
            <div className="basic-content p-6">
              <h2 className="basic-title text-2xl font-semibold text-gray-800">{basic.title || "Untitled"}</h2>
              <p className="basic-date text-sm text-gray-500 mt-1">{formatDate(basic.createdAt)}</p>
              <p className="basic-description text-gray-600 mt-3">{truncateContent(basic.description)}</p>
              
              {/* Media (Video or Audio) */}
              {basic.fileUrl && (
                <div className="basic-media-container mt-4">
                  {basic.fileType === 'video' ? (
                    mediaErrors[basic._id] === 'video' ? (
                      <VideoPlaceholder title={basic.title} />
                    ) : (
                      <div className="video-wrapper relative pt-[56.25%] bg-gray-100 rounded overflow-hidden">
                        <video
                          controls
                          playsInline
                          className="absolute top-0 left-0 w-full h-full rounded"
                          preload="metadata"
                          onError={(e) => handleVideoError(e, basic._id)}
                          onLoad={() => handleMediaLoad(basic._id, 'video')}
                          crossOrigin="anonymous"
                        >
                          <source src={getMediaUrl(basic.fileUrl)} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )
                  ) : basic.fileType === 'audio' && (
                    mediaErrors[basic._id] === 'audio' ? (
                      <AudioPlaceholder title={basic.title} />
                    ) : (
                      <div className="audio-wrapper relative">
                        <audio
                          controls
                          className="basic-audio w-full mt-2"
                          preload="metadata"
                          onError={(e) => handleAudioError(e, basic._id)}
                          onLoad={() => handleMediaLoad(basic._id, 'audio')}
                          crossOrigin="anonymous"
                        >
                          <source src={getMediaUrl(basic.fileUrl)} type="audio/mpeg" />
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Comments Section */}
              <div className="basic-comments-section mt-4">
                <h4 className="text-lg font-medium text-gray-700">Comments:</h4>
                <ul className="basic-comments list-disc pl-5 mt-2">
                  {basic.comments && basic.comments.length > 0 ? (
                    basic.comments.map((comment, commentIndex) => (
                      <li key={comment._id || comment.id || `comment-${basic._id}-${commentIndex}`} className="basic-comment flex items-center justify-between">
                        <span>{comment.content}</span>
                        {isAdmin && onDeleteComment && (
                          <button
                            onClick={() => onDeleteComment(basic._id, comment._id)}
                            className="delete-comment-btn text-red-600 hover:text-red-800 text-sm ml-2"
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No comments yet.</li>
                  )}
                </ul>
              </div>

              {/* Add Comment Section */}
              <div className="add-comment mt-4">
                <textarea
                  value={newComment[basic._id] || ''}
                  onChange={(e) => handleCommentChange(basic._id, e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <button
                  onClick={() => handleCommentSubmit(basic._id)}
                  className="submit-comment-btn mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                  disabled={!newComment[basic._id]?.trim()}
                >
                  Post Comment
                </button>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="admin-actions mt-4 flex space-x-4">
                  {onEdit && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(basic._id)}
                      className="update-btn px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mr-2 inline-block" />
                      Edit
                    </motion.button>
                  )}
                  {onDelete && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(basic._id)}
                      className="delete-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2 inline-block" />
                      Delete Basic
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BasicList;