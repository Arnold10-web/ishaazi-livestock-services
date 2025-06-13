import React, { useState, useCallback, useEffect } from 'react';
import { 
  Download, Play, Pause, ChevronDown, ChevronUp, 
  Edit2, Trash2, Share2, Calendar, Headphones, 
  Video, Clock, Eye
} from 'lucide-react';

const BasicList = ({
  basics = [],
  apiBaseUrl,
  isAdmin,
  onDelete,
  onEdit,
  isLoading
}) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [filteredBasics, setFilteredBasics] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null);
  
  const PLACEHOLDER_IMAGE = '/images/placeholder-media.png';
  
  // Handle audio/video play
  const handleAudioPlay = (itemId) => {
    if (playingAudio === itemId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(itemId);
    }
  };
  
  // Filter basics by type
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredBasics(basics);
    } else {
      setFilteredBasics(basics.filter(item => item.fileType === activeTab));
    }
  }, [basics, activeTab]);

  // Strip HTML tags helper
  const stripHtmlTags = useCallback((html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }, []);

  // Media URL handler
  const getMediaUrl = useCallback((url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    try {
      return url.startsWith('http') ? url : `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    } catch {
      return PLACEHOLDER_IMAGE;
    }
  }, [apiBaseUrl]);

  // Download handler
  const handleDownload = useCallback((item) => {
    const url = item.fileUrl || item.imageUrl;
    const ext = item.fileType === 'video' ? 'mp4' : 
               item.fileType === 'audio' ? 'mp3' : 'jpg';
    const filename = `${item.title || 'download'}.${ext}`;
    
    const link = document.createElement('a');
    link.href = getMediaUrl(url);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getMediaUrl]);

  // Share handler
  const handleShare = useCallback((item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: stripHtmlTags(item.description).substring(0, 100),
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying link:', err));
    }
  }, [stripHtmlTags]);

  const toggleDescription = useCallback((itemId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);
  
  // Get reading time
  const getReadingTime = useCallback((text) => {
    if (!text) return '< 1 min';
    const wordsPerMinute = 200;
    const words = stripHtmlTags(text).split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }, [stripHtmlTags]);

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get media type icon
  const getMediaIcon = (fileType) => {
    switch (fileType) {
      case 'audio':
        return <Headphones className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  // Loading state
  if (isLoading && basics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (basics.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No content available</h3>
          <p className="text-gray-600 dark:text-gray-400">Check back later for new farming basics content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter Tabs */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all' 
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
              activeTab === 'audio' 
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Headphones className="w-4 h-4 mr-1" />
            Audio
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
              activeTab === 'video' 
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Video className="w-4 h-4 mr-1" />
            Video
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBasics.map((item) => (
          <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Media Thumbnail */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
              <img
                src={getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
              
              {/* Media Type Badge */}
              <div className="absolute top-3 left-3">
                <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {getMediaIcon(item.fileType)}
                  <span className="ml-1 capitalize">{item.fileType || 'Media'}</span>
                </div>
              </div>

              {/* Play Button for Audio/Video */}
              {(item.fileType === 'audio' || item.fileType === 'video') && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => handleAudioPlay(item._id)}
                    className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                  >
                    {playingAudio === item._id ? (
                      <Pause className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Play className="w-6 h-6 text-emerald-600 ml-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title and Date */}
              <div className="mb-3">
                <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {item.title || "Untitled"}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(item.createdAt)}</span>
                  {item.description && (
                    <>
                      <span className="mx-2">•</span>
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{getReadingTime(item.description)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                    {expandedDescriptions[item._id] 
                      ? stripHtmlTags(item.description)
                      : `${stripHtmlTags(item.description).substring(0, 120)}${stripHtmlTags(item.description).length > 120 ? '...' : ''}`
                    }
                  </p>
                  {stripHtmlTags(item.description).length > 120 && (
                    <button
                      onClick={() => toggleDescription(item._id)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium mt-2 flex items-center"
                    >
                      {expandedDescriptions[item._id] ? 'Show less' : 'Show more'}
                      {expandedDescriptions[item._id] ? (
                        <ChevronUp className="ml-1 w-4 h-4" />
                      ) : (
                        <ChevronDown className="ml-1 w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(item)}
                    className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center px-3 py-1.5 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex space-x-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item._id)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Filtered Results */}
      {filteredBasics.length === 0 && basics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-lg mx-auto text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {getMediaIcon(activeTab)}
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No {activeTab} content found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There are no {activeTab} items available at the moment.
          </p>
          <button 
            onClick={() => setActiveTab('all')} 
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View All Content
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicList;