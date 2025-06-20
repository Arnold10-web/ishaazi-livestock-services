/**
 * Content Utilities
 * 
 * Utility functions for content processing and calculations
 */

/**
 * Calculate estimated read time based on content length
 * Uses average reading speed of 200-250 words per minute
 * 
 * @param {string} content - The content HTML or text
 * @returns {number} Estimated read time in minutes
 */
export const calculateReadTime = (content) => {
  if (!content || typeof content !== 'string') {
    return 1; // Minimum 1 minute
  }

  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace and filter empty strings)
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Average reading speed: 225 words per minute
  const wordsPerMinute = 225;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  
  return readTimeMinutes;
};

/**
 * Calculate estimated media duration for video/audio files
 * This would need to be implemented with actual media file analysis
 * For now, returns a placeholder that should be replaced with actual duration detection
 * 
 * @param {File} mediaFile - The media file
 * @returns {Promise<number>} Estimated duration in seconds
 */
export const calculateMediaDuration = async (mediaFile) => {
  if (!mediaFile) {
    return 0;
  }

  // This is a placeholder implementation
  // In a real application, you would use:
  // - HTML5 media elements to load and get duration
  // - Third-party libraries like ffprobe or similar
  // - Server-side media analysis
  
  return new Promise((resolve) => {
    if (mediaFile.type.startsWith('video/') || mediaFile.type.startsWith('audio/')) {
      const media = document.createElement(mediaFile.type.startsWith('video/') ? 'video' : 'audio');
      
      media.onloadedmetadata = () => {
        const duration = Math.ceil(media.duration) || 0;
        resolve(duration);
        // Clean up
        URL.revokeObjectURL(media.src);
      };
      
      media.onerror = () => {
        resolve(0); // Default if can't determine duration
        URL.revokeObjectURL(media.src);
      };
      
      media.src = URL.createObjectURL(mediaFile);
    } else {
      resolve(0);
    }
  });
};

/**
 * Format duration from seconds to human-readable format
 * 
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "5:30", "1:23:45")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Extract text content from HTML for word counting and read time calculation
 * 
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
export const extractTextFromHTML = (html) => {
  if (!html) return '';
  
  // Create a temporary div to parse HTML safely
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content and clean up extra whitespace
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Generate content metadata automatically
 * 
 * @param {string} content - Content HTML
 * @param {Object} options - Options for metadata generation
 * @returns {Object} Generated metadata
 */
export const generateContentMetadata = (content, options = {}) => {
  const plainText = extractTextFromHTML(content);
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readTime = calculateReadTime(content);
  
  // Generate a simple summary if none provided (first 150 characters)
  const autoSummary = plainText.length > 150 
    ? plainText.substring(0, 150).trim() + '...'
    : plainText;

  return {
    wordCount,
    readTime,
    autoSummary: options.generateSummary !== false ? autoSummary : null,
    characterCount: plainText.length,
    estimatedReadingTime: `${readTime} min read`
  };
};
