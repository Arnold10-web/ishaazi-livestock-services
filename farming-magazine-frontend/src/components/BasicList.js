import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Download, Play, Pause, ChevronDown, ChevronUp, 
  Edit2, Trash2, Share2, Calendar, Headphones, 
  Video, Clock, Eye, Volume2, VolumeX, SkipBack, SkipForward
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAlert } from '../hooks/useAlert';

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
  const [showControls, setShowControls] = useState({});
  const [mediaProgress, setMediaProgress] = useState({});
  const [mediaDuration, setMediaDuration] = useState({});
  const [mediaVolume, setMediaVolume] = useState({});
  const [isMuted, setIsMuted] = useState({});
  
  const audioRefs = useRef({});
  const alert = useAlert();
  
  const PLACEHOLDER_IMAGE = '/images/placeholder-media.png';
  
  // Handle audio/video play with real media elements
  const handleAudioPlay = useCallback((itemId, item) => {
    const mediaElement = audioRefs.current[itemId];
    
    if (playingAudio === itemId) {
      // Pause current media
      if (mediaElement) {
        mediaElement.pause();
      }
      setPlayingAudio(null);
    } else {
      // Pause any currently playing media
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      
      // Play new media
      if (mediaElement) {
        mediaElement.play().catch(error => {
          console.error('Error playing media:', error);
        });
      }
      setPlayingAudio(itemId);
    }
  }, [playingAudio]);
  
  // Filter basics by type
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredBasics(basics);
    } else {
      setFilteredBasics(basics.filter(item => item.fileType === activeTab));
    }
  }, [basics, activeTab]);

  // Cleanup audio/video elements on unmount
  useEffect(() => {
    const currentRefs = audioRefs.current;
    return () => {
      Object.values(currentRefs).forEach(element => {
        if (element && typeof element.pause === 'function') {
          element.pause();
        }
      });
    };
  }, []);

  // Update media progress
  const updateMediaProgress = useCallback((itemId) => {
    const mediaElement = audioRefs.current[itemId];
    if (mediaElement && mediaElement.duration) {
      const progress = (mediaElement.currentTime / mediaElement.duration) * 100;
      setMediaProgress(prev => ({ ...prev, [itemId]: progress }));
    }
  }, []);

  // Format time for display
  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle seek in media
  const handleSeek = useCallback((itemId, percentage) => {
    const mediaElement = audioRefs.current[itemId];
    if (mediaElement && mediaElement.duration) {
      const newTime = (percentage / 100) * mediaElement.duration;
      mediaElement.currentTime = newTime;
      setMediaProgress(prev => ({ ...prev, [itemId]: percentage }));
    }
  }, []);

  // Handle skip forward/backward
  const handleSkip = useCallback((itemId, seconds) => {
    const mediaElement = audioRefs.current[itemId];
    if (mediaElement) {
      const newTime = Math.max(0, Math.min(mediaElement.duration || 0, mediaElement.currentTime + seconds));
      mediaElement.currentTime = newTime;
      updateMediaProgress(itemId);
    }
  }, [updateMediaProgress]);

  // Handle mute toggle
  const handleMuteToggle = useCallback((itemId) => {
    const mediaElement = audioRefs.current[itemId];
    if (mediaElement) {
      mediaElement.muted = !mediaElement.muted;
      setIsMuted(prev => ({ ...prev, [itemId]: mediaElement.muted }));
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((itemId, volume) => {
    const mediaElement = audioRefs.current[itemId];
    if (mediaElement) {
      mediaElement.volume = volume;
      setMediaVolume(prev => ({ ...prev, [itemId]: volume }));
      if (volume > 0 && mediaElement.muted) {
        mediaElement.muted = false;
        setIsMuted(prev => ({ ...prev, [itemId]: false }));
      }
    }
  }, []);

  // Strip HTML tags helper with sanitization
  const stripHtmlTags = useCallback((html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    // Sanitize HTML content before setting innerHTML to prevent XSS
    tempDiv.innerHTML = DOMPurify.sanitize(html);
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

  // Download handler - fixed to prevent media playback conflicts
  const handleDownload = useCallback(async (item, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const url = item.fileUrl || item.imageUrl;
    if (!url) {
      alert.warning('No file available for download');
      return;
    }
    
    const fullUrl = getMediaUrl(url);
    const ext = item.fileType === 'video' ? 'mp4' : 
               item.fileType === 'audio' ? 'mp3' : 'jpg';
    const filename = `${item.title?.replace(/[^a-z0-9]/gi, '_') || 'download'}.${ext}`;
    
    try {
      if (url.startsWith('http')) {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.target = '_blank';
        link.download = filename;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(fullUrl, '_blank');
    }
  }, [getMediaUrl, alert]);

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
        .then(() => alert.success('Link copied to clipboard!'))
        .catch(err => console.error('Error copying link:', err));
    }
  }, [stripHtmlTags, alert]);

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
            {/* Enhanced Media Container */}
            <div 
              className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-lg overflow-hidden"
              onMouseEnter={() => setShowControls(prev => ({ ...prev, [item._id]: true }))}
              onMouseLeave={() => setShowControls(prev => ({ ...prev, [item._id]: playingAudio === item._id }))}
            >
              
              {item.fileType === 'video' && item.fileUrl ? (
                <>
                  {/* Video Element */}
                  <video
                    className="w-full h-full object-cover"
                    poster={getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE}
                    preload="metadata"
                    controls={false}
                    ref={(el) => {
                      if (el && !audioRefs.current[item._id]) {
                        audioRefs.current[item._id] = el;
                        el.onloadedmetadata = () => {
                          setMediaDuration(prev => ({ ...prev, [item._id]: el.duration }));
                          setMediaVolume(prev => ({ ...prev, [item._id]: el.volume }));
                        };
                        el.ontimeupdate = () => updateMediaProgress(item._id);
                        el.onended = () => setPlayingAudio(null);
                        el.onpause = () => setPlayingAudio(null);
                        el.onplay = () => setPlayingAudio(item._id);
                      }
                    }}
                  >
                    <source src={getMediaUrl(item.fileUrl)} type="video/mp4" />
                    <source src={getMediaUrl(item.fileUrl)} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Central Play Button */}
                  {playingAudio !== item._id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAudioPlay(item._id, item);
                        }}
                        className="w-16 h-16 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300"
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </button>
                    </div>
                  )}
                </>
              ) : item.fileType === 'audio' && item.fileUrl ? (
                <>
                  {/* Audio Poster */}
                  <div className="relative w-full h-full">
                    <img
                      src={getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    
                    {/* Audio Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20">
                      {/* Audio Icon */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                          <Headphones className="w-4 h-4" />
                          Audio
                        </div>
                      </div>
                      
                      {/* Central Play Button */}
                      {playingAudio !== item._id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAudioPlay(item._id, item);
                            }}
                            className="w-16 h-16 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300"
                          >
                            <Play className="w-6 h-6 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hidden Audio Element */}
                  <audio
                    ref={(el) => {
                      if (el && !audioRefs.current[item._id]) {
                        audioRefs.current[item._id] = el;
                        el.onloadedmetadata = () => {
                          setMediaDuration(prev => ({ ...prev, [item._id]: el.duration }));
                          setMediaVolume(prev => ({ ...prev, [item._id]: el.volume }));
                        };
                        el.ontimeupdate = () => updateMediaProgress(item._id);
                        el.onended = () => setPlayingAudio(null);
                        el.onpause = () => setPlayingAudio(null);
                        el.onplay = () => setPlayingAudio(item._id);
                      }
                    }}
                    preload="metadata"
                    style={{ display: 'none' }}
                  >
                    <source src={getMediaUrl(item.fileUrl)} type="audio/mpeg" />
                    <source src={getMediaUrl(item.fileUrl)} type="audio/wav" />
                    <source src={getMediaUrl(item.fileUrl)} type="audio/ogg" />
                    Your browser does not support the audio element.
                  </audio>
                </>
              ) : (
                <img
                  src={getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              )}

              {/* Enhanced Media Controls */}
              {(showControls[item._id] || playingAudio === item._id) && (item.fileType === 'video' || item.fileType === 'audio') && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 backdrop-blur-sm">
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 text-white text-xs mb-1">
                      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-xs">
                        {formatTime(audioRefs.current[item._id]?.currentTime)}
                      </span>
                      <div className="flex-1 relative">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-150"
                            style={{ width: `${mediaProgress[item._id] || 0}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={mediaProgress[item._id] || 0}
                          onChange={(e) => handleSeek(item._id, parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-xs">
                        {formatTime(mediaDuration[item._id])}
                      </span>
                    </div>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSkip(item._id, -10)}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 bg-black/20"
                      >
                        <SkipBack className="w-3 h-3 text-white" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAudioPlay(item._id, item);
                        }}
                        className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 bg-blue-600 hover:bg-blue-500"
                      >
                        {playingAudio === item._id ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleSkip(item._id, 10)}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 bg-black/20"
                      >
                        <SkipForward className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Volume Control */}
                      <button
                        onClick={() => handleMuteToggle(item._id)}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 bg-black/20"
                      >
                        {isMuted[item._id] ? (
                          <VolumeX className="w-3 h-3 text-white" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <div className="relative w-12">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                            style={{ width: `${(mediaVolume[item._id] || 1) * 100}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={mediaVolume[item._id] || 1}
                          onChange={(e) => handleVolumeChange(item._id, parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Media Type Badge */}
              <div className="absolute top-3 left-3">
                <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {getMediaIcon(item.fileType)}
                  <span className="ml-1 capitalize">{item.fileType || 'Media'}</span>
                </div>
              </div>
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
                    onClick={(e) => handleDownload(item, e)}
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