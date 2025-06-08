// Enhanced searchController.js with advanced features
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

// Search Analytics Schema
const searchAnalyticsSchema = new mongoose.Schema({
  searchTerm: { type: String, required: true },
  resultCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  userAgent: String,
  ipAddress: String,
  sessionId: String,
  clickedResults: [{ 
    contentId: String, 
    contentType: String, 
    position: Number,
    timestamp: Date 
  }]
});

const SearchAnalytics = mongoose.model('SearchAnalytics', searchAnalyticsSchema);

// Fuzzy search helper using Levenshtein distance
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

// Create fuzzy search terms
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

// Highlight search terms in text
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
 * Enhanced search across all content types with fuzzy search and analytics
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

    // Create search terms (original + fuzzy if enabled)
    let searchTerms = [query];
    if (fuzzy) {
      const fuzzyTerms = createFuzzyTerms(query);
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
      
      // Create advanced search query
      const searchQuery = {
        $and: [
          {
            $or: [
              // Text search with MongoDB's text index if available
              { $text: { $search: query } },
              // Fallback regex search
              { title: { $regex: query, $options: 'i' } },
              { content: { $regex: query, $options: 'i' } },
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
 * Filter content by specific criteria
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
 * Get available categories for a specific content type
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
 * Get available tags for a specific content type
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
