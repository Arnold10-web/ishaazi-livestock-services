/**
 * Enhanced Media Error Handling Utility
 * Provides better error handling for video, audio, and image files
 * 
 * @module utils/mediaErrorHandler
 */

/**
 * Media type configurations with fallbacks
 */
const MEDIA_CONFIGS = {
  image: {
    fallbacks: [
      '/placeholder-image.jpg',
      '/images/placeholder-media.png'
    ],
    supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  
  video: {
    fallbacks: [
      '/images/placeholder-media.png'
    ],
    supportedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.mp4', '.avi', '.mov', '.wmv']
  },
  
  audio: {
    fallbacks: [
      '/images/placeholder-media.png'
    ],
    supportedTypes: ['audio/mp3', 'audio/wav', 'audio/mpeg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.mp3', '.wav']
  },
  
  pdf: {
    fallbacks: [
      '/images/placeholder-media.png'
    ],
    supportedTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.pdf']
  }
};

/**
 * Media error types
 */
export const MEDIA_ERROR_TYPES = {
  NOT_FOUND: 'media_not_found',
  LOAD_FAILED: 'media_load_failed',
  UNSUPPORTED_TYPE: 'unsupported_media_type',
  SIZE_EXCEEDED: 'media_size_exceeded',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'media_timeout',
  CORRUPTED: 'media_corrupted'
};

/**
 * Client-side media error handler
 * This generates JavaScript code that can be injected into HTML responses
 */
export function generateClientErrorHandler() {
  return `
    <script>
    (function() {
      // Enhanced media error handling
      window.MediaErrorHandler = {
        // Handle image load errors
        handleImageError: function(imgElement, fallbackIndex = 0) {
          const fallbacks = [
            '/placeholder-image.jpg',
            '/images/placeholder-media.png',
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg=='
          ];
          
          if (fallbackIndex < fallbacks.length) {
            console.warn('Image load failed, trying fallback:', fallbacks[fallbackIndex]);
            imgElement.src = fallbacks[fallbackIndex];
            imgElement.onerror = () => this.handleImageError(imgElement, fallbackIndex + 1);
          } else {
            console.error('All image fallbacks failed');
            imgElement.style.display = 'none';
          }
        },
        
        // Handle video load errors
        handleVideoError: function(videoElement) {
          const errorCode = videoElement.error ? videoElement.error.code : 'unknown';
          console.warn('Video load failed with error code:', errorCode);
          
          // Create fallback element
          const fallback = document.createElement('div');
          fallback.className = 'video-fallback';
          fallback.innerHTML = \`
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px;">
              <p style="margin: 0; color: #666;">Video unavailable</p>
              <small style="color: #999;">Error code: \${errorCode}</small>
            </div>
          \`;
          
          videoElement.parentNode.replaceChild(fallback, videoElement);
        },
        
        // Handle audio load errors
        handleAudioError: function(audioElement) {
          const errorCode = audioElement.error ? audioElement.error.code : 'unknown';
          console.warn('Audio load failed with error code:', errorCode);
          
          // Create fallback element
          const fallback = document.createElement('div');
          fallback.className = 'audio-fallback';
          fallback.innerHTML = \`
            <div style="background: #f0f0f0; padding: 10px; text-align: center; border-radius: 4px;">
              <p style="margin: 0; color: #666; font-size: 14px;">🔇 Audio unavailable</p>
            </div>
          \`;
          
          audioElement.parentNode.replaceChild(fallback, audioElement);
        },
        
        // Add loading indicators
        addLoadingIndicator: function(mediaElement) {
          const loader = document.createElement('div');
          loader.className = 'media-loader';
          loader.innerHTML = \`
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666;">
              Loading...
            </div>
          \`;
          
          const container = mediaElement.parentNode;
          container.style.position = 'relative';
          container.appendChild(loader);
          
          const removeLoader = () => {
            if (loader.parentNode) {
              loader.parentNode.removeChild(loader);
            }
          };
          
          mediaElement.addEventListener('load', removeLoader);
          mediaElement.addEventListener('loadeddata', removeLoader);
          mediaElement.addEventListener('error', removeLoader);
          
          // Remove loader after timeout
          setTimeout(removeLoader, 10000);
        },
        
        // Initialize error handling for all media elements
        init: function() {
          // Handle images
          document.querySelectorAll('img').forEach(img => {
            if (!img.onerror) {
              img.onerror = () => this.handleImageError(img);
            }
          });
          
          // Handle videos
          document.querySelectorAll('video').forEach(video => {
            if (!video.onerror) {
              video.onerror = () => this.handleVideoError(video);
            }
            this.addLoadingIndicator(video);
          });
          
          // Handle audio
          document.querySelectorAll('audio').forEach(audio => {
            if (!audio.onerror) {
              audio.onerror = () => this.handleAudioError(audio);
            }
          });
        }
      };
      
      // Auto-initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          window.MediaErrorHandler.init();
        });
      } else {
        window.MediaErrorHandler.init();
      }
    })();
    </script>
  `;
}

/**
 * Server-side media validation
 */
export function validateMediaFile(file, mediaType) {
  const config = MEDIA_CONFIGS[mediaType];
  
  if (!config) {
    return {
      valid: false,
      error: MEDIA_ERROR_TYPES.UNSUPPORTED_TYPE,
      message: `Unsupported media type: ${mediaType}`
    };
  }
  
  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: MEDIA_ERROR_TYPES.SIZE_EXCEEDED,
      message: `File size exceeds limit of ${config.maxSize / (1024 * 1024)}MB`
    };
  }
  
  // Check MIME type
  if (!config.supportedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: MEDIA_ERROR_TYPES.UNSUPPORTED_TYPE,
      message: `Unsupported MIME type: ${file.mimetype}`
    };
  }
  
  // Check file extension
  const fileExt = '.' + file.originalname.split('.').pop().toLowerCase();
  if (!config.extensions.includes(fileExt)) {
    return {
      valid: false,
      error: MEDIA_ERROR_TYPES.UNSUPPORTED_TYPE,
      message: `Unsupported file extension: ${fileExt}`
    };
  }
  
  return {
    valid: true,
    message: 'Media file validation passed'
  };
}

/**
 * Get appropriate fallback for media type
 */
export function getMediaFallback(mediaType, fallbackIndex = 0) {
  const config = MEDIA_CONFIGS[mediaType];
  
  if (!config || !config.fallbacks[fallbackIndex]) {
    return '/images/placeholder-media.png';
  }
  
  return config.fallbacks[fallbackIndex];
}

/**
 * Express middleware for enhanced media error handling
 */
export function enhancedMediaMiddleware(req, res, next) {
  // Add media error handler to response locals
  res.locals.mediaErrorHandler = generateClientErrorHandler();
  
  // Add helper functions to response locals
  res.locals.getMediaFallback = getMediaFallback;
  res.locals.MEDIA_ERROR_TYPES = MEDIA_ERROR_TYPES;
  
  next();
}

/**
 * Progress indicator for large file uploads
 */
export function createProgressIndicator() {
  return `
    <div id="upload-progress" style="display: none; margin: 10px 0;">
      <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
        <div id="progress-bar" style="background: #4CAF50; height: 20px; width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <p id="progress-text" style="margin: 5px 0; font-size: 14px; color: #666;">Uploading...</p>
    </div>
    
    <script>
    function showUploadProgress() {
      document.getElementById('upload-progress').style.display = 'block';
    }
    
    function updateUploadProgress(percent, text) {
      document.getElementById('progress-bar').style.width = percent + '%';
      document.getElementById('progress-text').textContent = text || \`Uploading... \${percent}%\`;
    }
    
    function hideUploadProgress() {
      document.getElementById('upload-progress').style.display = 'none';
    }
    </script>
  `;
}

export default {
  MEDIA_ERROR_TYPES,
  generateClientErrorHandler,
  validateMediaFile,
  getMediaFallback,
  enhancedMediaMiddleware,
  createProgressIndicator
};