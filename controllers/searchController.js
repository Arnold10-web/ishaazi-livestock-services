/**
 * @file Search Controller
 * @description Advanced search functionality for the Online Farming Magazine platform:
 *  - Cross-content type search with relevance ranking
 *  - Fuzzy search with typo tolerance
 *  - Content filtering by type, date, tags, and more
 *  - Search suggestions with auto-complete
 *  - Search analytics tracking and reporting
 *  - Result highlighting and formatting
 * @module controllers/searchController
 */

import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Basic from '../models/Basic.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Dairy from '../models/Dairy.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';
import Beef from '../models/Beef.js';
import mongoose from 'mongoose';
import { optimizeSearchQuery } from '../middleware/searchOptimization.js';

/**
 * @constant {mongoose.Schema} searchAnalyticsSchema
 * @description Schema for tracking search behavior and performance analytics
 */
const searchAnalyticsSchema = new mongoose.Schema({
  /**
   * @property {String} searchTerm - The query string entered by the user
   */
  searchTerm: { type: String, required: true },
  
  /**
   * @property {Number} resultCount - Number of results returned for the search
   */
  resultCount: { type: Number, default: 0 },
  
  /**
   * @property {Date} timestamp - When the search was performed
   */
  timestamp: { type: Date, default: Date.now },
  
  /**
   * @property {String} userAgent - Browser/device information
   */
  userAgent: String,
  
  /**
   * @property {String} ipAddress - Anonymized IP for geographic analysis
   */
  ipAddress: String,
  
  /**
   * @property {String} sessionId - User session identifier
   */
  sessionId: String,
  
  /**
   * @property {Array} clickedResults - Tracks which results users clicked on
   * @property {String} clickedResults.contentId - ID of the clicked content
   * @property {String} clickedResults.contentType - Type of content clicked
   * @property {Number} clickedResults.position - Position in search results
   * @property {Date} clickedResults.timestamp - When the result was clicked
   */
  clickedResults: [{ 
    contentId: String, 
    contentType: String, 
    position: Number,
    timestamp: Date 
  }]
});

/**
 * @constant {mongoose.Model} SearchAnalytics
 * @description Model for search analytics data
 */
const SearchAnalytics = mongoose.model('SearchAnalytics', searchAnalyticsSchema);

/**
 * @function levenshteinDistance
 * @description Calculates the edit distance between two strings 
 * to measure similarity for fuzzy search matching
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} The edit distance (lower = more similar)
 * @private
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * @function createFuzzyTerms
 * @description Generates variations of search terms to handle common typos
 * and misspellings for improved search accuracy
 * @param {string} query - Original search query
 * @param {number} threshold - Maximum edit distance to consider (default: 2)
 * @returns {Array<string>} Array of search term variations
 * @private
 */
function createFuzzyTerms(query, threshold = 2) {
  const words = query.toLowerCase().split(' ');
  const fuzzyTerms = [];
  
  words.forEach(word => {
    if (word.length > 3) {
      // Generate variations with common typos
      fuzzyTerms.push(
        word,
        word.replace(/(.)(.)/, '$2$1'), // transpose
        word.slice(0, -1), // deletion
        word + '?', // wildcard
        word.replace(/(.)(.)(.*)/, '$1.$3') // substitution
      );
    } else {
      fuzzyTerms.push(word);
    }
  });
  
  return [...new Set(fuzzyTerms)];
}

/**
 * @function highlightSearchTerms
 * @description Wraps matching search terms in HTML mark tags for highlighting
 * @param {string} text - The content text to process
 * @param {Array<string>} searchTerms - Terms to highlight in the text
 * @returns {string} HTML-formatted text with highlighted search terms
 * @private
 */
function highlightSearchTerms(text, searchTerms) {
  if (!text || !searchTerms) return text;
  
  let highlightedText = text;
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}

/**
 * @function searchAll
 * @description Performs comprehensive search across all content types with advanced features:
 * - Fuzzy matching for typo tolerance
 * - Result highlighting
 * - Content filtering by type, date, tags, views
 * - Sorting options (relevance, date, title, views)
 * - Pagination
 * - Search analytics tracking
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.query - Search query string
 * @param {number} [req.query.page=1] - Result page number
 * @param {number} [req.query.limit=10] - Results per page
 * @param {Array<string>} [req.query.contentTypes] - Content types to search
 * @param {boolean} [req.query.fuzzy=false] - Enable fuzzy matching
 * @param {boolean} [req.query.highlight=true] - Highlight matching terms
 * @param {string} [req.query.sortBy='relevance'] - Sort order (relevance|date|title|views)
 * @param {string} [req.query.dateStart] - Filter by start date
 * @param {string} [req.query.dateEnd] - Filter by end date
 * @param {string|Array<string>} [req.query.tags] - Filter by tags
 * @param {number} [req.query.minViews] - Filter by minimum view count
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with search results and metadata
 */
export const searchAll = async (req, res) => {
  try {
    console.log('🔍 SEARCH DEBUG - Full request object keys:', Object.keys(req));
    console.log('🔍 SEARCH DEBUG - req.query:', req.query);
    console.log('🔍 SEARCH DEBUG - req.params:', req.params);
    console.log('🔍 SEARCH DEBUG - req.body:', req.body);
    console.log('🔍 SEARCH DEBUG - req.url:', req.url);
    
    const { 
      query, 
      page = 1, 
      limit = 10, 
      contentTypes = [], 
      fuzzy = false,
      highlight = true,
      sortBy = 'relevance', // relevance, date, title, views
      dateStart,
      dateEnd,
      tags,
      minViews
    } = req.query;
    
    const parsedLimit = parseInt(limit);
    const skip = (parseInt(page) - 1) * parsedLimit;
    
    // Debug: Log the received query parameters
    console.log('🔍 Received query params:', req.query);
    console.log('🔍 Query value:', query);
    console.log('🔍 Query type:', typeof query);
    
    // Validate that we have a search query
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    console.log('🔍 Enhanced search initiated:', { 
      query, 
      page, 
      limit: parsedLimit, 
      contentTypes, 
      fuzzy,
      highlight,
      sortBy 
    });

    // Record search analytics
    const searchRecord = new SearchAnalytics({
      searchTerm: query,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      sessionId: req.sessionID || 'anonymous'
    });

    // Optimize search query using search optimization middleware
    const optimizedQuery = optimizeSearchQuery(query);
    console.log('🔍 Original query:', query);
    console.log('🔍 Optimized query:', optimizedQuery);

    // Create search terms (optimized + fuzzy if enabled)
    let searchTerms = [optimizedQuery || query];
    if (fuzzy) {
      const fuzzyTerms = createFuzzyTerms(optimizedQuery || query);
      searchTerms = [...searchTerms, ...fuzzyTerms];
      console.log('🔍 Fuzzy search terms:', fuzzyTerms);
    }

    // Define which models to search based on contentTypes parameter
    const modelsToSearch = contentTypes.length > 0 
      ? getModelsByContentTypes(contentTypes) 
      : [Blog, News, Basic, Farm, Magazine, Dairy, Goat, Piggery, Beef];

    // Create enhanced search promises for each model
    const searchPromises = modelsToSearch.map(async (Model) => {
      const modelName = Model.modelName.toLowerCase();
      
      // Create advanced search query with optimization
      const searchQuery = {
        $and: [
          {
            $or: [
              // Optimized text search with MongoDB's text index if available
              { $text: { $search: optimizedQuery || query } },
              // Fallback regex search with optimized query
              { title: { $regex: optimizedQuery || query, $options: 'i' } },
              { content: { $regex: optimizedQuery || query, $options: 'i' } },
            ]
          },
          { published: true } // Only return published content
        ]
      };

      // Add date range filter
      if (dateStart || dateEnd) {
        const dateFilter = {};
        if (dateStart) dateFilter.$gte = new Date(dateStart);
        if (dateEnd) dateFilter.$lte = new Date(dateEnd);
        searchQuery.$and.push({ createdAt: dateFilter });
      }

      // Add tags filter (for models that support tags)
      if (tags && ['blog', 'news', 'dairy', 'beef', 'goat', 'piggery'].includes(modelName)) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        searchQuery.$and.push({ tags: { $in: tagArray } });
      }

      // Add minimum views filter
      if (minViews && ['blog', 'news', 'farm', 'magazine'].includes(modelName)) {
        searchQuery.$and.push({ views: { $gte: parseInt(minViews) } });
      }

      // Add description field if the model has it
      if (['blog', 'news', 'farm', 'magazine'].includes(modelName)) {
        searchQuery.$and[0].$or.push({ description: { $regex: query, $options: 'i' } });
      }

      // Add fuzzy search terms if enabled
      if (fuzzy && searchTerms.length > 1) {
        const fuzzyOr = searchTerms.slice(1).map(term => ({
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { content: { $regex: term, $options: 'i' } }
          ]
        }));
        searchQuery.$and[0].$or.push(...fuzzyOr.flat());
      }

      try {
        // Determine sort criteria
        let sortCriteria = {};
        switch (sortBy) {
          case 'date':
            sortCriteria = { createdAt: -1 };
            break;
          case 'title':
            sortCriteria = { title: 1 };
            break;
          case 'views':
            sortCriteria = { views: -1, createdAt: -1 };
            break;
          case 'relevance':
          default:
            // Use text score if text search is used, otherwise sort by date
            sortCriteria = { score: { $meta: 'textScore' }, createdAt: -1 };
            break;
        }

        const results = await Model
          .find(searchQuery)
          .sort(sortCriteria)
          .limit(parsedLimit)
          .skip(skip)
          .lean(); // Use lean() for better performance

        console.log(`📊 ${modelName} search results:`, results.length);

        // Process results with highlighting and metadata
        const processedResults = results.map(result => {
          const processedResult = {
            ...result,
            contentType: modelName,
            searchScore: result.score || 0
          };

          // Add highlighting if enabled
          if (highlight) {
            if (processedResult.title) {
              processedResult.highlightedTitle = highlightSearchTerms(processedResult.title, [query]);
            }
            if (processedResult.content) {
              // Create excerpt with highlighting
              const excerpt = processedResult.content.substring(0, 300) + '...';
              processedResult.highlightedExcerpt = highlightSearchTerms(excerpt, [query]);
            }
            if (processedResult.description) {
              processedResult.highlightedDescription = highlightSearchTerms(processedResult.description, [query]);
            }
          }

          return processedResult;
        });

        return processedResults;
      } catch (error) {
        console.error(`❌ Error searching ${modelName}:`, error.message);
        return [];
      }
    });

    // Execute all search promises
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and combine results
    const allResults = searchResults.flat();
    
    // Sort combined results by relevance score if using relevance sort
    if (sortBy === 'relevance') {
      allResults.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    }

    // Collect available tags from all models
    const availableTags = new Set();
    try {
      const tagModels = [Blog, News, Dairy, Beef, Goat, Piggery];
      for (const Model of tagModels) {
        const tags = await Model.distinct('tags', { published: true });
        tags.flat().forEach(tag => tag && availableTags.add(tag));
      }
    } catch (error) {
      console.error('Error collecting available tags:', error);
    }

    // Update search analytics with result count
    searchRecord.resultCount = allResults.length;
    await searchRecord.save();

    // Calculate pagination info
    const totalResults = allResults.length;
    const totalPages = Math.ceil(totalResults / parsedLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log('✅ Search completed:', {
      totalResults,
      currentPage: page,
      totalPages,
      fuzzyEnabled: fuzzy,
      highlightEnabled: highlight
    });

    res.json({
      success: true,
      data: {
        results: allResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults,
          hasNextPage,
          hasPrevPage,
          resultsPerPage: parsedLimit
        },
        searchMeta: {
          query,
          fuzzySearch: fuzzy,
          highlighting: highlight,
          sortBy,
          searchTermsUsed: searchTerms.length,
          processingTime: Date.now() - searchRecord.timestamp
        },
        availableTags: Array.from(availableTags).sort()
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @function filterContent
 * @description Filters content by multiple criteria with sorting and pagination
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.contentType - Type of content to filter
 * @param {Array<string>} [req.query.categories] - Categories to filter by
 * @param {Array<string>} [req.query.tags] - Tags to filter by
 * @param {string} [req.query.dateFrom] - Start date for filtering
 * @param {string} [req.query.dateTo] - End date for filtering
 * @param {string} [req.query.author] - Filter by content author
 * @param {string} [req.query.sortBy='createdAt'] - Field to sort by
 * @param {string} [req.query.sortOrder='desc'] - Sort direction (asc|desc)
 * @param {number} [req.query.page=1] - Result page number
 * @param {number} [req.query.limit=10] - Results per page
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with filtered content and metadata
 */
export const filterContent = async (req, res) => {
  try {
    const { 
      contentType, 
      categories = [],
      tags = [], 
      dateFrom, 
      dateTo,
      author,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required',
      });
    }

    // Get the model for the specified content type
    const Model = getModelByContentType(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    // Build filter query
    const filter = { published: true };
    
    // Add category filter
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }
    
    // Add tags filter (if the model supports tags)
    if (tags.length > 0 && ['blog', 'news', 'dairy', 'beef', 'goat', 'piggery'].includes(contentType)) {
      filter.tags = { $in: tags };
    }
    
    // Add date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Add author filter if applicable
    if (author) {
      filter.author = author;
    }

    // Execute query with pagination and sorting
    const results = await Model.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Model.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Content filtered successfully',
      data: {
        results,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter content',
      error: error.message
    });
  }
};

/**
 * @function getCategories
 * @description Retrieves available categories for a specific content type
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.contentType - The content type to get categories for
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with list of categories and counts
 */
export const getCategories = async (req, res) => {
  try {
    const { contentType } = req.params;
    
    console.log('Getting categories for content type:', contentType);
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required',
      });
    }

    const Model = getModelByContentType(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    console.log('Using model:', Model.modelName);
    
    // Check if collection exists and has documents
    const count = await Model.estimatedDocumentCount();
    console.log('Document count:', count);
    
    if (count === 0) {
      // No documents in collection, return empty array
      return res.status(200).json({
        success: true,
        message: 'No documents found for this content type',
        data: []
      });
    }
    
    const categories = await Model.distinct('category');
    console.log('Retrieved categories:', categories);
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories.filter(Boolean) // Filter out null or undefined values
    });
    
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
};

/**
 * @function getTags
 * @description Retrieves available tags for a specific content type
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.contentType - The content type to get tags for
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with list of tags and counts
 */
export const getTags = async (req, res) => {
  try {
    const { contentType } = req.params;
    
    console.log('Getting tags for content type:', contentType);
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required',
      });
    }

    const Model = getModelByContentType(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    console.log('Using model:', Model.modelName);

    // Check if the model has tags field
    if (!['blog', 'news', 'dairy', 'beef', 'goat', 'piggery'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'This content type does not support tags',
      });
    }
    
    // Check if collection exists and has documents
    const count = await Model.estimatedDocumentCount();
    console.log('Document count:', count);
    
    if (count === 0) {
      // No documents in collection, return empty array
      return res.status(200).json({
        success: true,
        message: 'No documents found for this content type',
        data: []
      });
    }

    let allTags = await Model.distinct('tags');
    console.log('Retrieved raw tags:', allTags);
    
    // Flatten nested arrays if any
    allTags = allTags.flat().filter(Boolean);
    console.log('Processed tags:', allTags);
    
    res.status(200).json({
      success: true,
      message: 'Tags retrieved successfully',
      data: allTags
    });
    
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tags',
      error: error.message
    });
  }
};

/**
 * Get search suggestions/autocomplete
 */
/**
 * @function getSearchSuggestions
 * @description Provides search autocomplete suggestions based on:
 *  - Partial text matches in content titles
 *  - Previous popular searches
 *  - Recent user searches
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.query - Partial search text
 * @param {number} [req.query.limit=10] - Maximum suggestions to return
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with ranked suggestions
 */
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          popularSearches: await getPopularSearches(5)
        }
      });
    }

    console.log('🔍 Getting search suggestions for:', query);

    // Get suggestions from different sources
    const [titleSuggestions, tagSuggestions, popularSearches, recentSearches] = await Promise.all([
      getTitleSuggestions(query, Math.ceil(limit / 2)),
      getTagSuggestions(query, Math.ceil(limit / 4)),
      getPopularSearches(Math.ceil(limit / 4)),
      getRecentSearches(query, Math.ceil(limit / 4))
    ]);

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...titleSuggestions.map(s => ({ ...s, type: 'title' })),
      ...tagSuggestions.map(s => ({ ...s, type: 'tag' })),
      ...recentSearches.map(s => ({ ...s, type: 'recent' }))
    ];

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = allSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
      )
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        popularSearches: popularSearches.slice(0, 5),
        query: query
      }
    });

  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Track search analytics
 */
/**
 * @function trackSearchAnalytics
 * @description Records search activity and click behavior for analytics
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.searchTerm - The search query
 * @param {number} req.body.resultCount - Number of results returned
 * @param {Object} [req.body.clickData] - Information about clicked results
 * @param {string} req.body.clickData.contentId - ID of clicked content
 * @param {string} req.body.clickData.contentType - Type of clicked content
 * @param {number} req.body.clickData.position - Position in search results
 * @param {Object} res - Express response object
 * @returns {Object} JSON confirmation response
 */
export const trackSearchAnalytics = async (req, res) => {
  try {
    const { searchTerm, resultCount, clickData } = req.body;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    // Create or update search analytics record
    let analyticsRecord = await SearchAnalytics.findOne({
      searchTerm: searchTerm.toLowerCase(),
    });

    if (analyticsRecord) {
      analyticsRecord.searchCount = (analyticsRecord.searchCount || 0) + 1;
      analyticsRecord.lastSearched = new Date();
      if (clickData) {
        analyticsRecord.clickedResults.push({
          ...clickData,
          timestamp: new Date()
        });
      }
    } else {
      analyticsRecord = new SearchAnalytics({
        searchTerm: searchTerm.toLowerCase(),
        searchCount: 1,
        resultCount: resultCount || 0,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID || 'anonymous',
        clickedResults: clickData ? [{ ...clickData, timestamp: new Date() }] : []
      });
    }

    await analyticsRecord.save();

    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });

  } catch (error) {
    console.error('❌ Error tracking search analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track analytics'
    });
  }
};

/**
 * Get search analytics dashboard data
 */
/**
 * @function getSearchAnalytics
 * @description Provides comprehensive search analytics for the admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.startDate] - Start date for analytics period (default: 30 days ago)
 * @param {string} [req.query.endDate] - End date for analytics period (default: current date)
 * @param {number} [req.query.limit=20] - Maximum results to return for each metric
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with search analytics data:
 *  - Top searches by frequency
 *  - Most clicked search results
 *  - Zero-result searches
 *  - Search volume trend
 *  - Click-through rates
 */
export const getSearchAnalytics = async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      limit = 20 
    } = req.query;

    console.log('📊 Getting search analytics data');

    // Get top searches
    const topSearches = await SearchAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: '$searchTerm',
          count: { $sum: '$searchCount' },
          avgResultCount: { $avg: '$resultCount' },
          lastSearched: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get search trends over time
    const searchTrends = await SearchAnalytics.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          searchCount: { $sum: 1 },
          uniqueTerms: { $addToSet: '$searchTerm' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get zero result searches
    const zeroResultSearches = await SearchAnalytics.find({
      resultCount: 0,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: -1 }).limit(50);

    res.json({
      success: true,
      data: {
        topSearches,
        searchTrends: searchTrends.map(trend => ({
          date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
          searchCount: trend.searchCount,
          uniqueTermsCount: trend.uniqueTerms.length
        })),
        zeroResultSearches: zeroResultSearches.map(search => ({
          searchTerm: search.searchTerm,
          timestamp: search.timestamp,
          userAgent: search.userAgent
        })),
        summary: {
          totalSearches: await SearchAnalytics.countDocuments({
            timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }),
          uniqueSearchTerms: (await SearchAnalytics.distinct('searchTerm', {
            timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
          })).length,
          avgResultsPerSearch: await SearchAnalytics.aggregate([
            {
              $match: {
                timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
              }
            },
            {
              $group: {
                _id: null,
                avgResults: { $avg: '$resultCount' }
              }
            }
          ]).then(result => result[0]?.avgResults || 0)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting search analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
};

// Helper functions
/**
 * @function getModelByContentType
 * @description Maps content type string to corresponding Mongoose model
 * @param {string} contentType - Content type identifier
 * @returns {mongoose.Model|undefined} Mongoose model or undefined if not found
 * @private
 */
function getModelByContentType(contentType) {
  const contentTypeMap = {
    blog: Blog,
    blogs: Blog,
    news: News,
    basic: Basic,
    basics: Basic,
    farm: Farm,
    farms: Farm,
    magazine: Magazine,
    magazines: Magazine,
    dairy: Dairy,
    dairies: Dairy,
    goat: Goat,
    goats: Goat,
    piggery: Piggery,
    piggeries: Piggery,
    beef: Beef,
    beefs: Beef
  };

  return contentTypeMap[contentType];
}

/**
 * @function getModelsByContentTypes
 * @description Converts an array of content type strings to Mongoose models
 * @param {Array<string>} contentTypes - Array of content type identifiers
 * @returns {Array<mongoose.Model>} Array of valid Mongoose models
 * @private
 */
function getModelsByContentTypes(contentTypes) {
  return contentTypes.map(type => getModelByContentType(type)).filter(Boolean);
}

// Helper functions for search suggestions
async function getTitleSuggestions(query, limit) {
  try {
    const models = [Blog, News, Basic, Farm, Magazine, Dairy, Goat, Piggery, Beef];
    const suggestions = [];

    for (const Model of models) {
      const results = await Model.find({
        title: { $regex: query, $options: 'i' },
        published: true
      })
      .select('title')
      .limit(limit)
      .lean();

      results.forEach(result => {
        suggestions.push({
          text: result.title,
          relevance: calculateRelevance(result.title, query),
          contentType: Model.modelName.toLowerCase()
        });
      });
    }

    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting title suggestions:', error);
    return [];
  }
}

/**
 * @function getTagSuggestions
 * @description Finds matching tags across all content models
 * @param {string} query - Partial tag text
 * @param {number} limit - Maximum tags to return
 * @returns {Array} Matching tags with relevance scores
 * @private
 * @async
 */
async function getTagSuggestions(query, limit) {
  try {
    const models = [Blog, News, Basic, Farm, Magazine, Dairy, Goat, Piggery, Beef];
    const allTags = [];

    for (const Model of models) {
      const tags = await Model.distinct('tags', {
        tags: { $regex: query, $options: 'i' },
        published: true
      });
      allTags.push(...tags.flat());
    }

    const uniqueTags = [...new Set(allTags)]
      .filter(tag => tag && tag.toLowerCase().includes(query.toLowerCase()))
      .map(tag => ({
        text: tag,
        relevance: calculateRelevance(tag, query),
        contentType: 'tag'
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return uniqueTags;
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    return [];
  }
}

async function getPopularSearches(limit) {
  try {
    const popular = await SearchAnalytics.aggregate([
      {
        $group: {
          _id: '$searchTerm',
          count: { $sum: '$searchCount' },
          avgResults: { $avg: '$resultCount' }
        }
      },
      { $match: { avgResults: { $gt: 0 } } }, // Only searches with results
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return popular.map(item => ({
      text: item._id,
      relevance: item.count,
      searchCount: item.count
    }));
  } catch (error) {
    console.error('Error getting popular searches:', error);
    return [];
  }
}

async function getRecentSearches(query, limit) {
  try {
    const recent = await SearchAnalytics.find({
      searchTerm: { $regex: query, $options: 'i' },
      resultCount: { $gt: 0 }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('searchTerm resultCount');

    return recent.map(item => ({
      text: item.searchTerm,
      relevance: calculateRelevance(item.searchTerm, query) + (item.resultCount / 100),
      isRecent: true
    }));
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
}

/**
 * @function calculateRelevance
 * @description Calculates relevance score between search text and query
 * @param {string} text - Text to evaluate
 * @param {string} query - Search query
 * @returns {number} Relevance score (0-100)
 * @private
 */
function calculateRelevance(text, query) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) return 100;
  
  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return 80;
  
  // Contains query gets medium score
  if (lowerText.includes(lowerQuery)) return 60;
  
  // Word boundary match gets good score
  const wordBoundary = new RegExp(`\\b${lowerQuery}`, 'i');
  if (wordBoundary.test(lowerText)) return 70;
  
  // Fuzzy match gets lower score
  const distance = levenshteinDistance(lowerText, lowerQuery);
  const maxLength = Math.max(lowerText.length, lowerQuery.length);
  const similarity = (maxLength - distance) / maxLength;
  
  return Math.max(0, similarity * 40);
}

/**
 * Default export of all search controller functions
 * @exports {Object} Search controller functions
 */
export default {
  searchAll,
  filterContent,
  getCategories,
  getTags,
  getSearchSuggestions,
  trackSearchAnalytics,
  getSearchAnalytics
};
