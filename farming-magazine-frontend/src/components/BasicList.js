import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  AlertCircle, Download, MessageSquare, Play, Pause, Volume2, VolumeX,
  ChevronDown, ChevronUp, Edit2, Trash2, SkipBack, SkipForward,
  Share2, BookOpen, Calendar, Headphones, Video, Info, Maximize2
} from 'lucide-react';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

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
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [playingId, setPlayingId] = useState(null);
  // Remove likedItems state
  // const [likedItems, setLikedItems] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [filteredBasics, setFilteredBasics] = useState([]);
  // const audioRefs = useRef({}); // Unused for now
  const PLACEHOLDER_IMAGE = '/images/placeholder-media.png';
  
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
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying link:', err));
    }
  }, [stripHtmlTags]);

  // Comment handlers
  const handleCommentChange = useCallback((itemId, content) => {
    setNewComment(prev => ({ ...prev, [itemId]: content }));
  }, []);

  const handleCommentSubmit = useCallback((itemId) => {
    const content = newComment[itemId]?.trim();
    if (content && onAddComment) {
      onAddComment(itemId, content);
      setNewComment(prev => ({ ...prev, [itemId]: '' }));
    }
  }, [newComment, onAddComment]);

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

  // Audio Player Component
  const AudioPlayer = ({ item }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    // Toggle play/pause
    const togglePlay = () => {
      if (isPlaying) {
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        audioRef.current.play();
        setPlayingId(item._id);
      }
      setIsPlaying(!isPlaying);
    };

    // Handle time update
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    };

    // Handle seeking
    const handleSeek = (e) => {
      if (!progressBarRef.current || !audioRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const seekPos = (e.clientX - rect.left) / rect.width;
      if (!isNaN(audioRef.current.duration)) {
        audioRef.current.currentTime = seekPos * audioRef.current.duration;
      }
    };

    // Handle time skip
    const handleSkip = (seconds) => {
      if (audioRef.current) {
        audioRef.current.currentTime += seconds;
      }
    };

    // Handle volume change
    const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    };

    // Toggle mute
    const toggleMute = () => {
      if (audioRef.current) {
        audioRef.current.muted = !isMuted;
      }
      setIsMuted(!isMuted);
    };

    // Handle playback rate change
    const changePlaybackRate = (rate) => {
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
        setPlaybackRate(rate);
      }
    };

    // Handle metadata loading
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    // Format playback rate for display
    const formatPlaybackRate = (rate) => {
      return `${rate}x`;
    };

    return (
      <>
        {/* Enhanced Cover Art with Play Button Overlay */}
        <div className="relative aspect-square overflow-hidden group cursor-pointer bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900" onClick={togglePlay}>
          <img
            src={getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75 group-hover:saturate-150"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PLACEHOLDER_IMAGE;
            }}
          />
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          
          {/* Enhanced Play/Pause Overlay with animations */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20
              transition-all duration-300 transform 
              ${isPlaying 
                ? 'bg-white/25 scale-100 opacity-100' 
                : 'bg-emerald-500/95 hover:bg-emerald-600/95 group-hover:scale-110 opacity-0 group-hover:opacity-100'
              }
            `}>
              {isPlaying ? 
                <Pause className="w-8 h-8 text-white drop-shadow-lg" /> : 
                <Play className="w-8 h-8 text-white ml-1 drop-shadow-lg" />
              }
            </div>
          </div>
          
          {/* Audio type indicator */}
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
              <Headphones className="w-3 h-3 mr-1" />
              Audio
            </div>
          </div>
          
          {/* Enhanced Progress Overlay with glow effect */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-black/60 to-black/40">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                boxShadow: progress > 0 ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
              }}
            />
          </div>
          
          {/* Duration badge */}
          {duration > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                {formatTime(duration)}
              </div>
            </div>
          )}
        </div>

        {/* Audio Controls */}
        <div className="p-4 space-y-4">
          {/* Title and Duration */}
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {item.title || "Untitled Audio"}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatTime(duration)}</span>
                <span className="mx-2">•</span>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
                    {formatPlaybackRate(playbackRate)}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              aria-label={isExpanded ? "Collapse player" : "Expand player"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          {/* Progress Bar */}
          <div className="space-y-1">
            <div 
              ref={progressBarRef}
              className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer overflow-hidden"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          {/* Enhanced Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleSkip(-10)}
                className="group p-2.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 flex flex-col items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                aria-label="Skip back 10 seconds"
              >
                <SkipBack size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">10s</span>
              </button>
              <button
                onClick={togglePlay}
                className={`group p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600 dark:from-emerald-800/60 dark:to-teal-800/60 dark:text-emerald-300 shadow-emerald-200/50 dark:shadow-emerald-800/30' 
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-300/50 dark:shadow-emerald-700/30 hover:from-emerald-600 hover:to-emerald-700'
                }`}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? 
                  <Pause size={18} className="group-hover:scale-110 transition-transform" /> : 
                  <Play size={18} className="ml-0.5 group-hover:scale-110 transition-transform" />
                }
              </button>
              <button 
                onClick={() => handleSkip(10)}
                className="group p-2.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 flex flex-col items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">10s</span>
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="group p-2.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                aria-label="Volume"
              >
                {isMuted ? 
                  <VolumeX size={16} className="group-hover:scale-110 transition-transform" /> : 
                  <Volume2 size={16} className="group-hover:scale-110 transition-transform" />
                }
              </button>
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full right-0 mb-2 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-10"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-28 h-2 accent-emerald-500 rounded-full appearance-none bg-gray-200 dark:bg-gray-600 hover:accent-emerald-600 transition-colors"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Extended Controls (only visible when expanded) */}
          {isExpanded && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-3 space-y-4">
              {/* Playback Speed Controls */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Playback Speed</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button 
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        playbackRate === rate 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-800/30' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Advanced Controls */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quick Actions</h4>
                <div className="flex justify-center space-x-3">
                  <button 
                    onClick={() => handleSkip(-30)}
                    className="group px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center transform hover:scale-105"
                  >
                    <SkipBack size={14} className="mr-1.5 group-hover:scale-110 transition-transform" />
                    30s
                  </button>
                  <button 
                    onClick={toggleMute}
                    className={`group px-4 py-2 text-xs font-medium rounded-lg flex items-center transition-all duration-200 transform hover:scale-105 ${
                      isMuted 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200/50 dark:shadow-red-800/30' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isMuted ? 
                      <VolumeX size={14} className="mr-1.5 group-hover:scale-110 transition-transform" /> : 
                      <Volume2 size={14} className="mr-1.5 group-hover:scale-110 transition-transform" />
                    }
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button 
                    onClick={() => handleSkip(30)}
                    className="group px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center transform hover:scale-105"
                  >
                    30s
                    <SkipForward size={14} className="ml-1.5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <audio
          ref={audioRef}
          src={getMediaUrl(item.fileUrl)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setPlayingId(null);
          }}
          preload="metadata"
        />
      </>
    ); // closes AudioPlayer
  };

  // Video Player Component
  const VideoPlayer = ({ item }) => {
    const [isHovered] = useState(false);  // Keep for future hover effects
    const [hasClicked, setHasClicked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls] = useState(false);  // Keep for future control visibility
    const playerRef = useRef(null);
    
    // Handle the preview click
    const handlePreviewClick = () => {
      setPlayingId(item._id);
      setHasClicked(true);
      setIsPlaying(true);
    };
    
    // Handle play/pause toggle
    const togglePlay = () => {
      if (isPlaying) {
        setIsPlaying(false);
        if (playingId === item._id) {
          setPlayingId(null);
        }
      } else {
        setIsPlaying(true);
        setPlayingId(item._id);
      }
    };
    
    // Handle time skip
    const handleSkip = (seconds) => {
      if (playerRef.current) {
        const player = playerRef.current.getInternalPlayer();
        if (player && typeof player.getCurrentTime === 'function') {
          player.seekTo(player.getCurrentTime() + seconds);
        }
      }
    };
    
    // Handle progress
    const handleProgress = (state) => {
      setCurrentTime(state.playedSeconds);
    };
    
    // Handle duration
    const handleDuration = (duration) => {
      setDuration(duration);
    };
    
    return (
      <>
        {/* Video Aspect Ratio Container */}
        <div className="relative pt-[56.25%]">
          <ReactPlayer
            ref={playerRef}
            url={getMediaUrl(item.fileUrl)}
            playing={isPlaying && playingId === item._id}
            controls={false} // Using custom controls
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
            light={!hasClicked && (item.imageUrl ? getMediaUrl(item.imageUrl) : true)}
            playIcon={
              <div 
                className="group relative bg-white/95 hover:bg-white rounded-full p-6 shadow-2xl transition-all duration-500 transform hover:scale-110 backdrop-blur-sm border border-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewClick();
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Play className="text-gray-800 group-hover:text-emerald-600 transition-colors duration-300 relative z-10" size={32} />
                <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" />
              </div>
            }
            onClickPreview={handlePreviewClick}
            onPlay={() => {
              setPlayingId(item._id);
              setIsPlaying(true);
            }}
            onPause={() => {
              if (playingId === item._id) {
                setIsPlaying(false);
              }
            }}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={() => {
              setIsPlaying(false);
              if (playingId === item._id) {
                setPlayingId(null);
              }
            }}
            config={{
              youtube: {
                playerVars: { modestbranding: 1 }
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  poster: getMediaUrl(item.imageUrl) || PLACEHOLDER_IMAGE
                }
              }
            }}
          />
        </div>
        
        {/* Enhanced Custom Video Controls - Only show when playing or hovered */}
        {(hasClicked && (showControls || isHovered)) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 z-20 transition-opacity duration-300">
            {/* Enhanced Progress Bar */}
            <div 
              className="h-2 bg-gray-600/60 rounded-full overflow-hidden cursor-pointer mb-4 group"
              onClick={(e) => {
                if (playerRef.current) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  playerRef.current.seekTo(percent);
                }
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="group p-3 text-white hover:text-emerald-400 transition-all duration-200 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transform hover:scale-105"
                >
                  {isPlaying ? 
                    <Pause size={20} className="group-hover:scale-110 transition-transform" /> : 
                    <Play size={20} className="group-hover:scale-110 transition-transform" />
                  }
                </button>
                
                {/* Skip Backward 10s */}
                <button
                  onClick={() => handleSkip(-10)}
                  className="group p-2 text-white hover:text-emerald-400 transition-all duration-200 flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/15"
                >
                  <SkipBack size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">10s</span>
                </button>
                
                {/* Skip Forward 10s */}
                <button
                  onClick={() => handleSkip(10)}
                  className="group p-2 text-white hover:text-emerald-400 transition-all duration-200 flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/15"
                >
                  <SkipForward size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">10s</span>
                </button>
                
                {/* Enhanced Time Display */}
                <div className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-emerald-400">{formatTime(currentTime)}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Volume and Fullscreen */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (playerRef.current) {
                      const player = playerRef.current.getInternalPlayer();
                      if (player && player.requestFullscreen) {
                        player.requestFullscreen();
                      }
                    }
                  }}
                  className="group p-2 text-white hover:text-emerald-400 transition-all duration-200 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transform hover:scale-105"
                >
                  <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Hover Overlay - Only show when not playing */}
        {isHovered && !isPlaying && !hasClicked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center z-10 pointer-events-none">
            <div className="group relative bg-white/95 rounded-full p-6 shadow-2xl backdrop-blur-sm border border-white/50 animate-pulse">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 opacity-75" />
              <Play className="text-gray-800 relative z-10" size={32} />
            </div>
          </div>
        )}
      </>
    ); // closes VideoPlayer
  };

  // Loading and Empty States
  if (isLoading && basics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (basics.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-lg mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">No content available</h3>
          <p className="text-gray-600 dark:text-gray-400">Check back later for new farming basics content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center"
      >
      
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            All Content
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${activeTab === 'audio' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            <Headphones className="w-4 h-4 mr-1" />
            Audio
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${activeTab === 'video' 
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            <Video className="w-4 h-4 mr-1" />
            Video
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredBasics.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col h-full"
            >
              {/* Unified Media Card: Player and Content in One Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-0 flex-1 flex flex-col overflow-hidden">
                {/* Media Player at the top */}
                <div className="w-full">
                  {item.fileType === 'video' ? (
                    <VideoPlayer item={item} />
                  ) : (
                    <AudioPlayer item={item} />
                  )}
                </div>
                {/* Content Details below player */}
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg text-gray-900 dark:text-white line-clamp-2">
                        {item.title || "Untitled"}
                      </h3>
                      <div className="flex space-x-2">
                        {/* Like button removed */}
                        <button 
                          onClick={() => handleShare(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 rounded-full transition-colors"
                          aria-label="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.description && (
                        <div className="flex items-center">
                          <BookOpen className="w-3.5 h-3.5 mr-1" />
                          <span>{getReadingTime(item.description)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Description */}
                  {item.description && (
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        {expandedDescriptions[item._id] 
                          ? stripHtmlTags(item.description)
                          : `${stripHtmlTags(item.description).substring(0, 150)}${stripHtmlTags(item.description).length > 150 ? '...' : ''}`
                        }
                      </div>
                      {stripHtmlTags(item.description).length > 150 && (
                        <button
                          onClick={() => toggleDescription(item._id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium mt-2 flex items-center"
                        >
                          {expandedDescriptions[item._id] ? 'Show less' : 'Show more'}
                          {expandedDescriptions[item._id] ? (
                            <ChevronUp className="ml-1" size={16} />
                          ) : (
                            <ChevronDown className="ml-1" size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Download/Details Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <Download size={16} className="mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => toggleDescription(item._id)}
                      className="flex items-center justify-center py-2 px-4 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors text-sm font-medium"
                    >
                      <Info size={16} className="mr-2" />
                      Details
                    </button>
                  </div>
                  {/* Comments Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <MessageSquare className="text-emerald-500 mr-2" size={18} />
                        <h3 className="font-medium text-gray-800 dark:text-white">Comments</h3>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.comments?.length || 0} comment{item.comments?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                      {item.comments?.length > 0 ? (
                        item.comments
                          .filter(comment => comment && typeof comment === 'object' && comment._id)
                          .map((comment, index) => (
                            <div key={comment._id || index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <p className="text-gray-800 dark:text-gray-200 text-sm">
                                  {comment.content || 'No content'}
                                </p>
                                {isAdmin && (
                                  <button
                                    onClick={() => onDeleteComment(item._id, comment._id)}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 ml-2"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                    <div className="mt-3">
                      <textarea
                        value={newComment[item._id] || ''}
                        onChange={(e) => handleCommentChange(item._id, e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        rows={2}
                      />
                      <button
                        onClick={() => handleCommentSubmit(item._id)}
                        disabled={!newComment[item._id]?.trim()}
                        className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex space-x-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item._id)}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Edit2 size={16} className="mr-2" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item._id)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Empty State for Filtered Results */}
      {filteredBasics.length === 0 && basics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-lg mx-auto text-center mt-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">No {activeTab} content found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">There are no {activeTab} items available at the moment.</p>
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