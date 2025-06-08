import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, Video, Headphones, Play, Volume2, Clock, Download, Share2, Heart, TrendingUp, Users } from 'lucide-react';

const BasicPage = () => {
  const [audioContent, setAudioContent] = useState([]);
  const [videoContent, setVideoContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [playingMedia, setPlayingMedia] = useState(null);
  
  const isMountedRef = useRef(true);
  const audioRef = useRef(null);

  const axiosInstance = useRef(axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 30000,
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })).current;

  const fetchMediaContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/content/basics');
      
      if (response.data && response.data.data) {
        const { basics = [] } = response.data.data;
        
        // Separate audio and video content
        const videos = basics.filter(item => {
          const fileUrl = item.fileUrl?.toLowerCase() || '';
          return fileUrl.includes('.mp4') || fileUrl.includes('.webm') || fileUrl.includes('.mov') || fileUrl.includes('.avi');
        });
        
        const audios = basics.filter(item => {
          const fileUrl = item.fileUrl?.toLowerCase() || '';
          return fileUrl.includes('.mp3') || fileUrl.includes('.wav') || fileUrl.includes('.aac') || fileUrl.includes('.ogg');
        });
        
        setVideoContent(videos);
        setAudioContent(audios);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching media content:', err);
      setError('Failed to load media content. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchMediaContent();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMediaContent]);

  const handlePlayAudio = (audioId, audioUrl) => {
    if (playingMedia === audioId) {
      setPlayingMedia(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingMedia(audioId);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const VideoCard = ({ video }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden hover:shadow-4xl transition-all duration-700 border border-white/40 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
        }}
      >
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700 p-[2px]">
          <div className="h-full w-full rounded-3xl bg-white/90 backdrop-blur-xl" />
        </div>
        
        <div className="relative z-10">
          {/* Enhanced video thumbnail with floating play button */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden rounded-t-3xl">
            {video.imageUrl ? (
              <motion.img 
                src={video.imageUrl} 
                alt={video.title}
                className="w-full h-full object-cover"
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: isHovered ? 360 : 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  <Video className="w-20 h-20 text-slate-400" />
                </motion.div>
              </div>
            )}
            
            {/* Floating gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            
            {/* Animated play button with ripple effect */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: isHovered ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.button 
                className="relative bg-white/95 backdrop-blur-sm rounded-full p-8 hover:bg-white transform hover:scale-110 shadow-2xl shadow-black/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-12 h-12 text-slate-800 ml-2" />
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 border-4 border-white rounded-full"
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.button>
            </motion.div>
            
            {/* Enhanced duration badge */}
            {video.duration && (
              <motion.div
                className="absolute bottom-4 right-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-black/80 backdrop-blur-lg text-white text-sm px-4 py-2 rounded-full font-medium border border-white/20 shadow-lg">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {formatDuration(video.duration)}
                </div>
              </motion.div>
            )}
            
            {/* Trending badge for popular videos */}
            {video.views > 100 && (
              <motion.div
                className="absolute top-4 left-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center shadow-lg">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  TRENDING
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Enhanced content section */}
          <div className="p-8">
            <motion.h3 
              className="text-2xl font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-500"
              layoutId={`title-${video._id}`}
            >
              {video.title}
            </motion.h3>
            <p className="text-slate-600 text-base mb-8 line-clamp-3 leading-relaxed">{video.description}</p>
            
            {/* Enhanced stats section */}
            <div className="flex items-center justify-between mb-6">
              <motion.div 
                className="flex items-center bg-gradient-to-r from-slate-100 to-slate-200 rounded-full px-4 py-3 border border-slate-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-semibold text-slate-700">{formatDuration(video.duration) || 'Unknown'}</span>
              </motion.div>
              <motion.div 
                className="flex items-center bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full px-4 py-3 border border-emerald-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-4 h-4 mr-2 text-emerald-600" />
                <span className="font-semibold text-emerald-700">{video.views || 0} views</span>
              </motion.div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-4">
              <motion.button
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Now
              </motion.button>
              
              <motion.button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                  isLiked 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/25' 
                    : 'bg-white/80 text-slate-600 hover:bg-red-50 shadow-slate-200'
                }`}
                whileHover={{ scale: 1.1, rotate: isLiked ? 0 : 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
              
              <motion.button
                className="p-4 rounded-2xl bg-white/80 text-slate-600 hover:bg-blue-50 shadow-lg shadow-slate-200 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const AudioCard = ({ audio }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-white/20 hover:scale-[1.02] transform relative"
      >
        {/* Animated border gradient on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px]"
          animate={{ backgroundPosition: isHovered ? '200% 0' : '0% 0' }}
          style={{ backgroundSize: '200% 100%' }}
        >
          <div className="h-full w-full rounded-2xl bg-white/90 backdrop-blur-lg" />
        </motion.div>
        
        <div className="relative z-10 p-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden"
                whileHover={{ rotateY: 180 }}
                transition={{ duration: 0.6 }}
              >
                {/* Shimmering overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={isHovered ? { x: ['-100%', '100%'] } : {}}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  style={{ transform: 'skewX(-20deg)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <Headphones className="w-10 h-10 text-white relative z-10" />
              </motion.div>
            </div>
            <div className="flex-grow min-w-0">
              <motion.h3 
                className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300"
                layoutId={`audio-title-${audio._id}`}
              >
                {audio.title}
              </motion.h3>
              <p className="text-slate-600 text-base mb-6 line-clamp-2 leading-relaxed">{audio.description}</p>
              
              {/* Enhanced control section */}
              <div className="flex items-center justify-between">
                <motion.button
                  onClick={() => handlePlayAudio(audio._id, audio.fileUrl)}
                  className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden ${
                    playingMedia === audio._id
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Button background animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    animate={playingMedia === audio._id ? { x: ['-100%', '100%'] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <motion.div
                    animate={playingMedia === audio._id ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {playingMedia === audio._id ? (
                      <Volume2 className="w-5 h-5 mr-2 relative z-10" />
                    ) : (
                      <Play className="w-5 h-5 mr-2 relative z-10" />
                    )}
                  </motion.div>
                  
                  <span className="relative z-10">
                    {playingMedia === audio._id ? 'Playing' : 'Play Audio'}
                  </span>
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="flex items-center bg-gradient-to-r from-slate-100 to-slate-200 rounded-full px-4 py-2 border border-slate-200 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Clock className="w-4 h-4 mr-2 text-slate-600" />
                    <span className="font-medium text-slate-700">{formatDuration(audio.duration) || 'Unknown'}</span>
                  </motion.div>
                  
                  <motion.button
                    className="p-3 rounded-full bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 shadow-lg shadow-slate-200 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-200 rounded w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load media content</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={fetchMediaContent}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Hidden audio element for playing audio content */}
      <audio ref={audioRef} onEnded={() => setPlayingMedia(null)} />
      
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-slate-800 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Farm Basics
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full max-w-md mx-auto mb-10"
          ></motion.div>
          <motion.p 
            className="text-xl md:text-2xl text-slate-700 max-w-5xl mx-auto leading-relaxed font-light"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Master the art of farming through our carefully curated collection of 
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg mx-1"> premium video tutorials</span> and
            <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg mx-1"> expert audio guides</span>
            designed to elevate your agricultural knowledge.
          </motion.p>
        </motion.div>

        {/* Enhanced Stats Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="group hover:scale-105 transition-all duration-500">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/25">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <div className="text-5xl font-bold text-slate-800 mb-3">{videoContent.length}</div>
                <div className="text-slate-600 font-semibold text-lg">Video Tutorials</div>
                <div className="text-slate-500 text-sm mt-1">Professional farming videos</div>
              </div>
            </div>
          </div>
          <div className="group hover:scale-105 transition-all duration-500">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/25">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <div className="text-5xl font-bold text-slate-800 mb-3">{audioContent.length}</div>
                <div className="text-slate-600 font-semibold text-lg">Audio Guides</div>
                <div className="text-slate-500 text-sm mt-1">Expert audio content</div>
              </div>
            </div>
          </div>
          <div className="group hover:scale-105 transition-all duration-500">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/25">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="text-5xl font-bold text-slate-800 mb-3">{videoContent.length + audioContent.length}</div>
                <div className="text-slate-600 font-semibold text-lg">Total Resources</div>
                <div className="text-slate-500 text-sm mt-1">Complete learning library</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-3 border border-white/40 shadow-2xl">
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('video')}
                className={`group flex items-center px-10 py-5 rounded-2xl font-bold transition-all duration-500 transform relative overflow-hidden ${
                  activeTab === 'video'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105 shadow-blue-500/30'
                    : 'text-slate-700 hover:bg-white/80 hover:scale-105 hover:shadow-lg'
                }`}
              >
                {activeTab === 'video' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl animate-pulse opacity-30" />
                )}
                <Video className={`w-6 h-6 mr-4 transition-transform duration-300 ${activeTab === 'video' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-lg">Videos</span>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'video' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                }`}>
                  {videoContent.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`group flex items-center px-10 py-5 rounded-2xl font-bold transition-all duration-500 transform relative overflow-hidden ${
                  activeTab === 'audio'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl scale-105 shadow-purple-500/30'
                    : 'text-slate-700 hover:bg-white/80 hover:scale-105 hover:shadow-lg'
                }`}
              >
                {activeTab === 'audio' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl animate-pulse opacity-30" />
                )}
                <Headphones className={`w-6 h-6 mr-4 transition-transform duration-300 ${activeTab === 'audio' ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-lg">Audio</span>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'audio' 
                    ? 'bg-white/25 text-white' 
                    : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                }`}>
                  {audioContent.length}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Content Display */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16"
        >
          {activeTab === 'video' ? (
            <>
              {videoContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {videoContent.map((video, index) => (
                    <motion.div
                      key={video._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                    >
                      <VideoCard video={video} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="text-center py-24"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">No video tutorials yet</h3>
                  <p className="text-slate-600 text-lg">Our team is working on bringing you amazing video content. Check back soon!</p>
                </motion.div>
              )}
            </>
          ) : (
            <>
              {audioContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {audioContent.map((audio, index) => (
                    <motion.div
                      key={audio._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                    >
                      <AudioCard audio={audio} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="text-center py-24"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Headphones className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">No audio guides yet</h3>
                  <p className="text-slate-600 text-lg">We're preparing excellent audio content for you. Stay tuned!</p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

      </main>
    </motion.div>
  );
};

export default BasicPage;