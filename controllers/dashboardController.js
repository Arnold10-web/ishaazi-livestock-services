/**
 * @file Dashboard Controller
 * @description Generates comprehensive analytics and statistics for the admin dashboard:
 *  - Content statistics and trends across all content types
 *  - Subscriber growth and engagement metrics
 *  - Newsletter performance analytics
 *  - Activity streams and recent content updates
 *  - Data visualization datasets
 * @module controllers/dashboardController
 */

import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Subscriber from '../models/Subscriber.js';
import Newsletter from '../models/Newsletter.js';
import Basic from '../models/Basic.js';
import Dairy from '../models/Dairy.js';
import Beef from '../models/Beef.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';

/**
 * @function getDashboardStats
 * @description Generates comprehensive statistics for the admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with multiple dashboard data sections:
 *  - Key performance indicators with trend percentages
 *  - Content distribution across all content types
 *  - Six-month content trend charts data
 *  - Recent activity stream
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get current month and previous month for comparison
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // 1. TOTAL CONTENT COUNT (DYNAMIC) - Including newsletters
    const totalContent = {
      blogs: await Blog.countDocuments(),
      news: await News.countDocuments(),
      events: await Event.countDocuments(),
      farms: await Farm.countDocuments(),
      magazines: await Magazine.countDocuments(),
      basics: await Basic.countDocuments(),
      dairy: await Dairy.countDocuments(),
      beef: await Beef.countDocuments(),
      goats: await Goat.countDocuments(),
      piggery: await Piggery.countDocuments(),
      newsletters: await Newsletter.countDocuments()
    };
    
    const totalContentCount = Object.values(totalContent).reduce((sum, count) => sum + count, 0);
    
    // Get previous month content count for percentage change
    const previousMonthContent = await Blog.countDocuments({
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    }) + await News.countDocuments({
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    }) + await Event.countDocuments({
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    }) + await Newsletter.countDocuments({
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    });
    
    const contentChange = previousMonthContent > 0 
      ? ((totalContentCount - previousMonthContent) / previousMonthContent * 100).toFixed(1)
      : 0;

    // 2. SUBSCRIBERS COUNT (DYNAMIC)
    const subscribersCount = await Subscriber.countDocuments();
    const activeSubscribers = await Subscriber.countDocuments({ isActive: true });
    const previousMonthSubscribers = await Subscriber.countDocuments({
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    });
    const subscribersChange = previousMonthSubscribers > 0
      ? ((subscribersCount - previousMonthSubscribers) / previousMonthSubscribers * 100).toFixed(1)
      : 0;

    // Newsletter Analytics
    const totalNewsletters = await Newsletter.countDocuments();
    const sentNewsletters = await Newsletter.countDocuments({ status: 'sent' });
    const newsletterOpenRate = await Newsletter.aggregate([
      { $match: { status: 'sent' } },
      { $group: { 
        _id: null, 
        totalSent: { $sum: '$sentCount' }, 
        totalOpens: { $sum: '$openCount' } 
      }}
    ]);
    const openRate = newsletterOpenRate[0] 
      ? ((newsletterOpenRate[0].totalOpens / newsletterOpenRate[0].totalSent) * 100).toFixed(1) + '%'
      : '0%';

    const newsletterClickRate = await Newsletter.aggregate([
      { $match: { status: 'sent' } },
      { $group: { 
        _id: null, 
        totalSent: { $sum: '$sentCount' }, 
        totalClicks: { $sum: '$clickCount' } 
      }}
    ]);
    const clickRate = newsletterClickRate[0] 
      ? ((newsletterClickRate[0].totalClicks / newsletterClickRate[0].totalSent) * 100).toFixed(1) + '%'
      : '0%';

    // 3. ENGAGEMENT RATE (DYNAMIC - based on comments)
    const totalComments = await Blog.aggregate([
      { $unwind: { path: '$comments', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const commentsCount = totalComments[0]?.count || 0;
    const engagementRate = totalContentCount > 0 
      ? ((commentsCount / totalContentCount) * 100).toFixed(0) + '%'
      : '0%';
    
    // Calculate previous month's engagement for comparison
    const previousMonthCommentsCount = await Blog.aggregate([
      { $match: { createdAt: { $gte: previousMonth, $lte: previousMonthEnd } } },
      { $unwind: { path: '$comments', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const prevCommentsCount = previousMonthCommentsCount[0]?.count || 0;
    const prevEngagementRate = previousMonthContent > 0 
      ? (prevCommentsCount / previousMonthContent) * 100
      : 0;
    const currentEngagementValue = totalContentCount > 0 
      ? (commentsCount / totalContentCount) * 100
      : 0;
    const engagementChange = prevEngagementRate > 0
      ? ((currentEngagementValue - prevEngagementRate) / prevEngagementRate * 100).toFixed(1)
      : currentEngagementValue > 0 ? 100 : 0;

    // 4. UPCOMING EVENTS COUNT (DYNAMIC)
    const upcomingEvents = await Event.countDocuments({
      date: { $gte: new Date() }
    });
    
    // Calculate previous month's upcoming events for comparison
    const previousMonthUpcomingEvents = await Event.countDocuments({
      date: { $gte: previousMonth },
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    });
    const eventsChange = previousMonthUpcomingEvents > 0
      ? ((upcomingEvents - previousMonthUpcomingEvents) / previousMonthUpcomingEvents * 100).toFixed(1)
      : upcomingEvents > 0 ? 100 : 0;

    // 5. CONTENT DISTRIBUTION (DYNAMIC) - Including newsletters
    const contentDistribution = [
      { name: 'Blogs', value: totalContent.blogs },
      { name: 'News', value: totalContent.news },
      { name: 'Events', value: totalContent.events },
      { name: 'Farms', value: totalContent.farms },
      { name: 'Magazines', value: totalContent.magazines },
      { name: 'Basics', value: totalContent.basics },
      { name: 'Dairy', value: totalContent.dairy },
      { name: 'Beef', value: totalContent.beef },
      { name: 'Goats', value: totalContent.goats },
      { name: 'Piggery', value: totalContent.piggery },
      { name: 'Newsletters', value: totalContent.newsletters }
    ].filter(item => item.value > 0); // Only show categories with content

    // 6. CONTENT TREND (DYNAMIC - last 6 months) - Including newsletters
    const contentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthlyBlogs = await Blog.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      const monthlyNews = await News.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      const monthlyEvents = await Event.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      const monthlyNewsletters = await Newsletter.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      const monthlySubscribers = await Subscriber.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      contentTrend.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        blogs: monthlyBlogs,
        news: monthlyNews,
        events: monthlyEvents,
        newsletters: monthlyNewsletters,
        subscribers: monthlySubscribers
      });
    }

    // 7. RECENT ACTIVITIES (DYNAMIC) - Including newsletter activities
    const recentBlogs = await Blog.find().sort({ createdAt: -1 }).limit(2);
    const recentNews = await News.find().sort({ createdAt: -1 }).limit(2);
    const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(1);
    const recentNewsletters = await Newsletter.find().sort({ createdAt: -1 }).limit(2);
    const recentSubscribers = await Subscriber.find().sort({ createdAt: -1 }).limit(2);

    const activities = [
      ...recentBlogs.map(blog => ({
        icon: 'edit',
        color: 'blue',
        title: 'Blog Updated',
        description: blog.title.length > 50 ? blog.title.substring(0, 50) + '...' : blog.title,
        time: getTimeAgo(blog.createdAt),
        status: blog.isPublished ? 'published' : 'draft'
      })),
      ...recentNews.map(news => ({
        icon: 'newspaper',
        color: 'green',
        title: 'News Added',
        description: news.title.length > 50 ? news.title.substring(0, 50) + '...' : news.title,
        time: getTimeAgo(news.createdAt),
        status: news.isPublished ? 'published' : 'draft'
      })),
      ...recentEvents.map(event => ({
        icon: 'calendar-plus',
        color: 'purple',
        title: 'Event Created',
        description: event.title.length > 50 ? event.title.substring(0, 50) + '...' : event.title,
        time: getTimeAgo(event.createdAt),
        status: 'draft'
      })),
      ...recentNewsletters.map(newsletter => ({
        icon: 'envelope',
        color: 'indigo',
        title: newsletter.status === 'sent' ? 'Newsletter Sent' : 'Newsletter Created',
        description: newsletter.subject.length > 50 ? newsletter.subject.substring(0, 50) + '...' : newsletter.subject,
        time: getTimeAgo(newsletter.createdAt),
        status: newsletter.status
      })),
      ...recentSubscribers.map(subscriber => ({
        icon: 'user-plus',
        color: 'cyan',
        title: 'New Subscriber',
        description: `${subscriber.email} joined ${subscriber.subscriptionType || 'general'}`,
        time: getTimeAgo(subscriber.createdAt),
        status: subscriber.isActive ? 'active' : 'inactive'
      }))
    ].slice(0, 8); // Limit to 8 most recent

    // 8. POPULAR CONTENT (DYNAMIC - based on views/comments)
    const popularBlogs = await Blog.find({ views: { $gt: 0 } })
      .sort({ views: -1 })
      .limit(3)
      .select('title views category');
    
    console.log('Popular blogs from DB:', popularBlogs.map(blog => ({ 
      title: blog.title, 
      actualViews: blog.views 
    })));
    
    const popularNews = await News.find({ views: { $gt: 0 } })
      .sort({ views: -1 })
      .limit(2)
      .select('title views category');

    const popularContent = [
      ...popularBlogs.map(blog => ({
        title: blog.title.length > 60 ? blog.title.substring(0, 60) + '...' : blog.title,
        category: 'Blog',
        categoryColor: 'blue',
        views: blog.views, // Use ACTUAL views from database
        trend: blog.views > 100 ? 1 : 0
      })),
      ...popularNews.map(news => ({
        title: news.title.length > 60 ? news.title.substring(0, 60) + '...' : news.title,
        category: 'News',
        categoryColor: 'green',
        views: news.views, // Use ACTUAL views from database
        trend: news.views > 100 ? 1 : 0
      }))
    ].slice(0, 5);

    // Quick actions (static but relevant) - Including newsletter actions
    const quickActions = [
      { icon: 'file-alt', color: 'blue', title: 'New Blog Post', description: 'Create content' },
      { icon: 'newspaper', color: 'green', title: 'Add News Item', description: 'Post updates' },
      { icon: 'calendar-plus', color: 'purple', title: 'Schedule Event', description: 'Plan ahead' },
      { icon: 'paper-plane', color: 'amber', title: 'Send Newsletter', description: 'Reach subscribers' },
      { icon: 'users', color: 'cyan', title: 'Manage Subscribers', description: 'View audience' },
      { icon: 'chart-line', color: 'pink', title: 'Newsletter Analytics', description: 'Track performance' }
    ];

    // Newsletter Performance Metrics
    const newsletterMetrics = {
      totalNewsletters,
      sentNewsletters,
      draftNewsletters: totalNewsletters - sentNewsletters,
      openRate,
      clickRate,
      totalSubscribers: subscribersCount,
      activeSubscribers,
      inactiveSubscribers: subscribersCount - activeSubscribers,
      subscriberGrowth: parseFloat(subscribersChange)
    };

    // Subscriber Distribution by Type
    const subscriberTypes = await Subscriber.aggregate([
      { $unwind: '$subscriptionType' },
      { $group: { _id: '$subscriptionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const subscriberDistribution = subscriberTypes.map(type => ({
      name: type._id,
      value: type.count
    }));

    // Return dynamic dashboard data
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalContent: { value: totalContentCount, change: parseFloat(contentChange) },
          subscribers: { value: subscribersCount, change: parseFloat(subscribersChange) },
          engagement: { value: engagementRate, change: parseFloat(engagementChange) },
          events: { value: upcomingEvents, change: parseFloat(eventsChange) }
        },
        activities,
        quickActions,
        contentDistribution,
        contentTrend,
        popularContent,
        newsletterMetrics,
        subscriberDistribution
      }
    });

  } catch (error) {
    console.log('Dashboard stats error:', error);
    
    // Also log what we found for debugging
    console.log('Debug: All blogs with views:', await Blog.find().select('title views').sort({ views: -1 }));
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Reset view counts to development-friendly values
/**
 * @function resetViewCounts
 * @description Development utility to reset view counts for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with reset statistics and sample data
 */
export const resetViewCounts = async (req, res) => {
  try {
    console.log('Starting view count reset for development...');
    
    // Generate random view counts between 1-5 for development
    const generateRandomViews = () => Math.floor(Math.random() * 5) + 1;
    
    // Reset blogs
    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} blogs to reset`);
    
    for (const blog of blogs) {
      const newViews = generateRandomViews();
      await Blog.findByIdAndUpdate(blog._id, { views: newViews });
      console.log(`Reset blog "${blog.title}" views to ${newViews}`);
    }
    
    // Reset news
    const news = await News.find({});
    console.log(`Found ${news.length} news items to reset`);
    
    for (const newsItem of news) {
      const newViews = generateRandomViews();
      await News.findByIdAndUpdate(newsItem._id, { views: newViews });
      console.log(`Reset news "${newsItem.title}" views to ${newViews}`);
    }
    
    // Get updated counts to show in response
    const updatedBlogs = await Blog.find({}).sort({ views: -1 }).limit(5);
    const updatedNews = await News.find({}).sort({ views: -1 }).limit(5);
    
    console.log('View count reset completed successfully');
    
    res.json({
      success: true,
      message: 'View counts reset to development values (1-5 views)',
      data: {
        blogsUpdated: blogs.length,
        newsUpdated: news.length,
        sampleBlogs: updatedBlogs.map(blog => ({
          title: blog.title,
          views: blog.views
        })),
        sampleNews: updatedNews.map(newsItem => ({
          title: newsItem.title,
          views: newsItem.views
        }))
      }
    });
    
  } catch (error) {
    console.error('Error resetting view counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset view counts',
      error: error.message
    });
  }
};

/**
 * @function getTimeAgo
 * @description Helper function that converts timestamps to human-readable relative time
 * @param {Date|string} date - The date to convert
 * @returns {string} Human-readable time ago string (e.g., "5 minutes ago")
 * @private
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return new Date(date).toLocaleDateString();
}

/**
 * Default export of all dashboard controller functions
 * @exports {Object} Dashboard controller functions
 */
export default {
  getDashboardStats,
  resetViewCounts
};
