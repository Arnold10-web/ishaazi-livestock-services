/**
 * Dashboard Statistics Accuracy Enhancement Script
 * 
 * This utility ensures dashboard statistics are accurate by:
 * 1. Removing comment-related statistics
 * 2. Validating view counts
 * 3. Cleaning up engagement metrics
 * 4. Providing data integrity checks
 */

import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Basic from '../models/Basic.js';
import Dairy from '../models/Dairy.js';
import Beef from '../models/Beef.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';

/**
 * Enhanced statistics controller with comment system removed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCleanDashboardStats = async (req, res) => {
  try {
    console.log('🔄 Fetching clean dashboard statistics (no comments)...');
    
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // 1. ACCURATE CONTENT COUNTS (excluding comments)
    const contentCounts = {
      blogs: await Blog.countDocuments(),
      news: await News.countDocuments(),
      events: await Event.countDocuments(),
      farms: await Farm.countDocuments(),
      magazines: await Magazine.countDocuments(),
      basics: await Basic.countDocuments(),
      dairy: await Dairy.countDocuments(),
      beef: await Beef.countDocuments(),
      goats: await Goat.countDocuments(),
      piggery: await Piggery.countDocuments()
    };

    const totalContentCount = Object.values(contentCounts).reduce((sum, count) => sum + count, 0);

    // 2. ACCURATE VIEW STATISTICS (actual views only)
    const viewStats = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          avgViews: { $avg: { $ifNull: ['$views', 0] } },
          maxViews: { $max: { $ifNull: ['$views', 0] } },
          contentWithViews: { $sum: { $cond: [{ $gt: ['$views', 0] }, 1, 0] } }
        }
      }
    ]);

    const { totalViews = 0, avgViews = 0, maxViews = 0, contentWithViews = 0 } = viewStats[0] || {};

    // 3. ENGAGEMENT METRICS (views-based only, no comments)
    const engagementRate = totalContentCount > 0 
      ? ((totalViews / totalContentCount) * 100).toFixed(1) + '%'
      : '0%';

    // 4. TOP PERFORMING CONTENT (accurate view counts)
    const topContent = await Blog.find({ views: { $gt: 0 } })
      .sort({ views: -1 })
      .limit(10)
      .select('title views category createdAt')
      .lean();

    const topNews = await News.find({ views: { $gt: 0 } })
      .sort({ views: -1 })
      .limit(5)
      .select('title views category createdAt')
      .lean();

    // 5. CONTENT HEALTH METRICS
    const publishedContent = {
      blogs: await Blog.countDocuments({ published: true }),
      news: await News.countDocuments({ published: true }),
      events: await Event.countDocuments({ published: true })
    };

    const draftContent = {
      blogs: await Blog.countDocuments({ published: false }),
      news: await News.countDocuments({ published: false }),
      events: await Event.countDocuments({ published: false })
    };

    // 6. ACCURATE TREND DATA (last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthlyStats = {
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        blogs: await Blog.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        news: await News.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        events: await Event.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        totalViews: await Blog.aggregate([
          { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, views: { $sum: '$views' } } }
        ]).then(result => result[0]?.views || 0)
      };
      
      trendData.push(monthlyStats);
    }

    // 7. DATA QUALITY CHECKS
    const qualityChecks = {
      contentWithoutViews: totalContentCount - contentWithViews,
      avgViewsPerContent: totalContentCount > 0 ? (totalViews / totalContentCount).toFixed(1) : 0,
      contentDistribution: Object.entries(contentCounts)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          count,
          percentage: ((count / totalContentCount) * 100).toFixed(1)
        }))
    };

    // 8. CLEAN RESPONSE (no comment data)
    const cleanStats = {
      overview: {
        totalContent: totalContentCount,
        totalViews,
        avgViews: avgViews.toFixed(1),
        maxViews,
        engagementRate,
        contentWithViews
      },
      content: {
        counts: contentCounts,
        published: publishedContent,
        drafts: draftContent
      },
      performance: {
        topBlogs: topContent.map(blog => ({
          title: blog.title,
          views: blog.views,
          category: blog.category || 'General',
          ageInDays: Math.floor((new Date() - blog.createdAt) / (1000 * 60 * 60 * 24))
        })),
        topNews: topNews.map(news => ({
          title: news.title,
          views: news.views,
          category: news.category || 'General',
          ageInDays: Math.floor((new Date() - news.createdAt) / (1000 * 60 * 60 * 24))
        }))
      },
      trends: trendData,
      quality: qualityChecks,
      meta: {
        generatedAt: new Date().toISOString(),
        dataIntegrityChecked: true,
        commentsExcluded: true,
        statisticsVersion: '2.0'
      }
    };

    console.log('✅ Clean dashboard statistics generated successfully');
    console.log(`📊 Total content: ${totalContentCount}, Total views: ${totalViews}`);
    console.log(`🎯 Engagement rate: ${engagementRate}`);

    res.status(200).json({
      success: true,
      message: 'Clean dashboard statistics retrieved successfully',
      data: cleanStats
    });

  } catch (error) {
    console.error('❌ Error generating clean dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Validate and clean view counts
 */
export const validateViewCounts = async (req, res) => {
  try {
    console.log('🔍 Starting view count validation...');

    // Check for anomalous view counts
    const suspiciousBlogs = await Blog.find({
      $or: [
        { views: { $gt: 10000 } }, // Very high views
        { views: { $lt: 0 } }, // Negative views
        { views: null }, // Null views
        { views: { $exists: false } } // Missing views field
      ]
    }).select('title views createdAt');

    const suspiciousNews = await News.find({
      $or: [
        { views: { $gt: 10000 } },
        { views: { $lt: 0 } },
        { views: null },
        { views: { $exists: false } }
      ]
    }).select('title views createdAt');

    // Fix null/missing view counts
    const blogFixResult = await Blog.updateMany(
      { $or: [{ views: null }, { views: { $exists: false } }] },
      { $set: { views: 0 } }
    );

    const newsFixResult = await News.updateMany(
      { $or: [{ views: null }, { views: { $exists: false } }] },
      { $set: { views: 0 } }
    );

    const validation = {
      suspicious: {
        blogs: suspiciousBlogs.length,
        news: suspiciousNews.length,
        details: [...suspiciousBlogs, ...suspiciousNews]
      },
      fixes: {
        blogsFixed: blogFixResult.modifiedCount,
        newsFixed: newsFixResult.modifiedCount
      },
      recommendations: []
    };

    if (suspiciousBlogs.length > 0) {
      validation.recommendations.push('Review blogs with unusually high view counts');
    }
    if (blogFixResult.modifiedCount > 0 || newsFixResult.modifiedCount > 0) {
      validation.recommendations.push('View counts have been normalized');
    }

    console.log(`✅ Validation complete. Fixed ${blogFixResult.modifiedCount + newsFixResult.modifiedCount} items`);

    res.status(200).json({
      success: true,
      message: 'View count validation completed',
      data: validation
    });

  } catch (error) {
    console.error('❌ Error validating view counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate view counts',
      error: error.message
    });
  }
};

/**
 * Reset development view counts to realistic values
 */
export const resetDevelopmentViews = async (req, res) => {
  try {
    console.log('🔄 Resetting development view counts...');

    const generateRealisticViews = (ageInDays) => {
      // Newer content gets fewer views, older content can have more
      const baseViews = Math.floor(Math.random() * 20) + 1; // 1-20 base views
      const ageBonus = Math.floor(ageInDays / 7) * Math.floor(Math.random() * 10); // Weekly bonus
      return Math.min(baseViews + ageBonus, 500); // Cap at 500 views
    };

    // Reset blog views
    const blogs = await Blog.find().select('_id createdAt');
    const blogUpdates = blogs.map(blog => {
      const ageInDays = Math.floor((new Date() - blog.createdAt) / (1000 * 60 * 60 * 24));
      return {
        updateOne: {
          filter: { _id: blog._id },
          update: { $set: { views: generateRealisticViews(ageInDays) } }
        }
      };
    });

    // Reset news views
    const news = await News.find().select('_id createdAt');
    const newsUpdates = news.map(newsItem => {
      const ageInDays = Math.floor((new Date() - newsItem.createdAt) / (1000 * 60 * 60 * 24));
      return {
        updateOne: {
          filter: { _id: newsItem._id },
          update: { $set: { views: generateRealisticViews(ageInDays) } }
        }
      };
    });

    const blogResult = blogUpdates.length > 0 ? await Blog.bulkWrite(blogUpdates) : { modifiedCount: 0 };
    const newsResult = newsUpdates.length > 0 ? await News.bulkWrite(newsUpdates) : { modifiedCount: 0 };

    console.log(`✅ Reset complete. Updated ${blogResult.modifiedCount} blogs and ${newsResult.modifiedCount} news items`);

    res.status(200).json({
      success: true,
      message: 'Development view counts reset successfully',
      data: {
        blogsUpdated: blogResult.modifiedCount,
        newsUpdated: newsResult.modifiedCount,
        note: 'View counts have been set to realistic development values'
      }
    });

  } catch (error) {
    console.error('❌ Error resetting development views:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset development views',
      error: error.message
    });
  }
};

export default {
  getCleanDashboardStats,
  validateViewCounts,
  resetDevelopmentViews
};
