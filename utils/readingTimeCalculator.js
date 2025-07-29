/**
 * @file Reading Time Calculator Utility
 * @description Server-side utility for calculating accurate reading time based on content analysis.
 * This provides consistent reading time calculations across the backend to match frontend calculations.
 * 
 * @author Online Farming Magazine Development Team
 * @lastUpdated July 29, 2025
 */

/**
 * Calculate estimated reading time based on content analysis
 * 
 * Uses research-based reading speeds:
 * - Average adult reading speed: 200-250 words per minute
 * - Technical content: slightly slower (200 WPM)
 * - Blog content: standard speed (225 WPM)
 * 
 * @param {string} content - HTML or plain text content
 * @param {Object} options - Configuration options
 * @param {number} [options.wordsPerMinute=225] - Average reading speed
 * @param {boolean} [options.includeTechnicalAdjustment=false] - Apply technical content adjustment
 * @returns {number} Estimated reading time in minutes (minimum 1)
 */
export const calculateReadingTime = (content, options = {}) => {
  if (!content || typeof content !== 'string') {
    return 1; // Minimum 1 minute for any content
  }

  const {
    wordsPerMinute = 225,
    includeTechnicalAdjustment = false
  } = options;

  // Remove HTML tags to get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words more accurately
  const words = plainText
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .split(' ')
    .filter(word => word.length > 0);
  
  const wordCount = words.length;
  
  // Apply technical content adjustment if specified
  let adjustedWPM = wordsPerMinute;
  if (includeTechnicalAdjustment) {
    // Technical farming content may be read slightly slower
    adjustedWPM = Math.max(180, wordsPerMinute * 0.9);
  }
  
  // Calculate reading time
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / adjustedWPM));
  
  return readingTimeMinutes;
};

/**
 * Calculate reading time with content type-specific adjustments
 * 
 * @param {string} content - Content to analyze
 * @param {string} contentType - Type of content (blog, news, technical, etc.)
 * @returns {number} Estimated reading time in minutes
 */
export const calculateReadingTimeByType = (content, contentType) => {
  const typeAdjustments = {
    blog: { wordsPerMinute: 225, includeTechnicalAdjustment: false },
    news: { wordsPerMinute: 250, includeTechnicalAdjustment: false }, // News read faster
    technical: { wordsPerMinute: 200, includeTechnicalAdjustment: true },
    dairy: { wordsPerMinute: 210, includeTechnicalAdjustment: true },
    beef: { wordsPerMinute: 210, includeTechnicalAdjustment: true },
    goats: { wordsPerMinute: 210, includeTechnicalAdjustment: true },
    piggery: { wordsPerMinute: 210, includeTechnicalAdjustment: true },
    basic: { wordsPerMinute: 235, includeTechnicalAdjustment: false }, // Beginner content
    farm: { wordsPerMinute: 215, includeTechnicalAdjustment: true },
    magazine: { wordsPerMinute: 230, includeTechnicalAdjustment: false },
    default: { wordsPerMinute: 225, includeTechnicalAdjustment: false }
  };

  const adjustment = typeAdjustments[contentType] || typeAdjustments.default;
  return calculateReadingTime(content, adjustment);
};

/**
 * Generate content statistics including word count and reading time
 * 
 * @param {string} content - Content to analyze
 * @param {string} [contentType='default'] - Type of content for adjustments
 * @returns {Object} Content statistics
 */
export const generateContentStats = (content, contentType = 'default') => {
  if (!content || typeof content !== 'string') {
    return {
      wordCount: 0,
      characterCount: 0,
      readingTime: 1,
      estimatedReadingTime: '1 min read'
    };
  }

  // Remove HTML tags for accurate counting
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words and characters
  const words = plainText
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);
  
  const wordCount = words.length;
  const characterCount = plainText.length;
  const readingTime = calculateReadingTimeByType(content, contentType);

  return {
    wordCount,
    characterCount,
    readingTime,
    estimatedReadingTime: `${readingTime} min read`
  };
};

/**
 * Validate if reading time is reasonable for given content
 * 
 * @param {string} content - Content to validate
 * @param {number} providedReadingTime - Reading time to validate
 * @returns {Object} Validation result with suggestions
 */
export const validateReadingTime = (content, providedReadingTime) => {
  const calculatedTime = calculateReadingTime(content);
  const difference = Math.abs(calculatedTime - providedReadingTime);
  const percentageDiff = (difference / calculatedTime) * 100;

  return {
    isValid: percentageDiff <= 25, // Allow 25% variance
    calculatedTime,
    providedTime: providedReadingTime,
    difference,
    percentageDifference: percentageDiff.toFixed(1),
    suggestion: percentageDiff > 25 ? calculatedTime : providedReadingTime
  };
};

export default {
  calculateReadingTime,
  calculateReadingTimeByType,
  generateContentStats,
  validateReadingTime
};
