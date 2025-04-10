import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  AlertCircle, Download, MessageSquare, Play, Pause, Volume2, VolumeX,
  ChevronDown, ChevronUp, Edit2, Trash2, SkipBack, SkipForward
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
  const audioRefs = useRef({});
  const PLACEHOLDER_IMAGE = '/images/placeholder-media.png';

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

  // Audio Player Component
  const AudioPlayer = ({ item }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);

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

    const handleTimeUpdate = () => {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    };

    const handleSeek = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const seekPos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = seekPos * audioRef.current.duration;
    };

    const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Cover Art */}
        {item.imageUrl && (
          <div className="relative aspect-square overflow-hidden">
            <img
              src={getMediaUrl(item.imageUrl)}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => e.target.src = PLACEHOLDER_IMAGE}
            />
          </div>
        )}

        {/* Audio Controls */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div 
              className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(audioRef.current?.duration || 0)}</span>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={getMediaUrl(item.fileUrl)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            setPlayingId(null);
          }}
          onDurationChange={handleTimeUpdate}
          preload="metadata"
        />
      </div>
    );
  };

  // Video Player Component
  const VideoPlayer = ({ item }) => (
    <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        url={getMediaUrl(item.fileUrl)}
        playing={playingId === item._id}
        controls
        width="100%"
        height="100%"
        className="absolute top-0 left-0"
        light={item.imageUrl ? getMediaUrl(item.imageUrl) : true}
        playIcon={
          <div className="bg-white/80 hover:bg-white rounded-full p-3 shadow-lg">
            <Play className="text-gray-900" size={24} />
          </div>
        }
        onClickPreview={() => setPlayingId(item._id)}
      />
    </div>
  );

  // Loading and Empty States
  if (isLoading && basics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (basics.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-800 dark:text-white">No content available</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Check back later or add some content</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >

      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {basics.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Media Player */}
              {item.fileType === 'video' ? (
                <VideoPlayer item={item} />
              ) : (
                <AudioPlayer item={item} />
              )}

              {/* Content Details */}
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white line-clamp-2">
                    {item.title || "Untitled"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Description with Read More/Less */}
                {item.description && (
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {expandedDescriptions[item._id] 
                        ? stripHtmlTags(item.description)
                        : `${stripHtmlTags(item.description).substring(0, 200)}${stripHtmlTags(item.description).length > 200 ? '...' : ''}`
                      }
                    </p>
                    {stripHtmlTags(item.description).length > 200 && (
                      <button
                        onClick={() => toggleDescription(item._id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium mt-1 flex items-center"
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

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>

                {/* Comments Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="text-blue-500" size={18} />
                    <h3 className="font-medium text-gray-800 dark:text-white">Comments</h3>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 mb-4">
                    {item.comments?.length > 0 ? (
                      item.comments.map((comment) => (
                        <div key={comment._id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-gray-800 dark:text-gray-200 text-sm">
                              {comment.content}
                            </p>
                            {isAdmin && (
                              <button
                                onClick={() => onDeleteComment(item._id, comment._id)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                aria-label="Delete comment"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-2">
                        No comments yet
                      </p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-4">
                    <textarea
                      value={newComment[item._id] || ''}
                      onChange={(e) => handleCommentChange(item._id, e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={2}
                    />
                    <button
                      onClick={() => handleCommentSubmit(item._id)}
                      disabled={!newComment[item._id]?.trim()}
                      className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      >
                        <Edit2 size={16} className="mr-2" />
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item._id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BasicList;