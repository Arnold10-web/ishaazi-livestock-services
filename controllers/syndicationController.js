import Blog from '../models/Blog.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Dairy from '../models/Dairy.js';
import Beef from '../models/Beef.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';
import Basic from '../models/Basic.js';

const BASE_URL = process.env.BASE_URL || 'https://ishaazilivestockservices.com';

// Helper function to escape XML characters
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// Helper function to create RSS item
const createRSSItem = (item, contentType) => {
  const title = escapeXml(item.title || item.name || 'Untitled');
  const description = escapeXml(stripHtml(item.content || item.description || item.summary || '').substring(0, 500));
  const link = `${BASE_URL}/${contentType}/${item._id}`;
  const pubDate = item.publishedAt || item.createdAt;
  const author = escapeXml(item.author || 'Ishaazi Livestock Services');
  const category = escapeXml(item.category || 'Agriculture');
  
  return `
    <item>
      <title>${title}</title>
      <description>${description}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <author>admin@ishaazilivestockservices.com (${author})</author>
      <category>${category}</category>
      ${item.imageUrl ? `<enclosure url="${BASE_URL}${item.imageUrl}" type="image/jpeg" />` : ''}
    </item>`;
};

// Helper function to create RSS feed structure
const createRSSFeed = (items, feedTitle, feedDescription, contentType) => {
  const rssItems = items.map(item => createRSSItem(item, contentType)).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${BASE_URL}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Ishaazi Livestock Services RSS Generator</generator>
    <webMaster>admin@ishaazilivestockservices.com (Ishaazi Livestock Services)</webMaster>
    <managingEditor>admin@ishaazilivestockservices.com (Editorial Team)</managingEditor>
    <image>
      <url>${BASE_URL}/images/ishaazi.jpg</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${BASE_URL}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${BASE_URL}/api/syndication/rss/${contentType}" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
};

// Get Blog RSS Feed
export const getBlogRSSFeed = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const blogs = await Blog.find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('title content author category imageUrl publishedAt createdAt')
      .lean();

    const feedTitle = 'Ishaazi Livestock Services - Blog Articles';
    const feedDescription = 'Latest farming insights, tips, and agricultural innovations from East Africa\'s leading livestock services provider.';
    
    const rssXml = createRSSFeed(blogs, feedTitle, feedDescription, 'blogs');
    
    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating blog RSS feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating RSS feed',
      error: error.message
    });
  }
};

// Get News RSS Feed
export const getNewsRSSFeed = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const news = await News.find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('title content summary author category imageUrl publishedAt createdAt')
      .lean();

    const feedTitle = 'Ishaazi Livestock Services - Latest News';
    const feedDescription = 'Breaking news and updates from the agricultural and livestock industry in East Africa.';
    
    const rssXml = createRSSFeed(news, feedTitle, feedDescription, 'news');
    
    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating news RSS feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating RSS feed',
      error: error.message
    });
  }
};

// Get All Content RSS Feed
export const getAllContentRSSFeed = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const perTypeLimit = Math.floor(parseInt(limit) / 5); // Distribute across content types
    
    // Fetch different content types
    const [blogs, news, events, magazines, dairies] = await Promise.all([
      Blog.find({ published: true })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(perTypeLimit)
        .select('title content author category imageUrl publishedAt createdAt')
        .lean(),
      News.find({ published: true })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(perTypeLimit)
        .select('title content summary author category imageUrl publishedAt createdAt')
        .lean(),
      Event.find({ published: true })
        .sort({ eventDate: -1, createdAt: -1 })
        .limit(perTypeLimit)
        .select('title description location eventDate imageUrl createdAt category')
        .lean(),
      Magazine.find({ published: true })
        .sort({ createdAt: -1 })
        .limit(perTypeLimit)
        .select('title description imageUrl createdAt category')
        .lean(),
      Dairy.find({ published: true })
        .sort({ createdAt: -1 })
        .limit(perTypeLimit)
        .select('title content category imageUrl createdAt')
        .lean()
    ]);

    // Combine and sort all content by date
    const allContent = [
      ...blogs.map(item => ({ ...item, contentType: 'blogs' })),
      ...news.map(item => ({ ...item, contentType: 'news' })),
      ...events.map(item => ({ ...item, contentType: 'events', content: item.description })),
      ...magazines.map(item => ({ ...item, contentType: 'magazines', content: item.description })),
      ...dairies.map(item => ({ ...item, contentType: 'dairies' }))
    ].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
     .slice(0, parseInt(limit));

    const feedTitle = 'Ishaazi Livestock Services - All Content';
    const feedDescription = 'Complete feed of all content from East Africa\'s premier agricultural and livestock services platform.';
    
    // Create RSS with mixed content types
    const rssItems = allContent.map(item => createRSSItem(item, item.contentType)).join('');
    
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${BASE_URL}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Ishaazi Livestock Services RSS Generator</generator>
    <webMaster>admin@ishaazilivestockservices.com (Ishaazi Livestock Services)</webMaster>
    <managingEditor>admin@ishaazilivestockservices.com (Editorial Team)</managingEditor>
    <image>
      <url>${BASE_URL}/images/ishaazi.jpg</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${BASE_URL}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${BASE_URL}/api/syndication/rss/all" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
    
    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating all content RSS feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating RSS feed',
      error: error.message
    });
  }
};

// Generate XML Sitemap
export const generateSitemap = async (req, res) => {
  try {
    // Fetch all published content
    const [blogs, news, events, farms, magazines, dairies, beefs, goats, piggeries, basics] = await Promise.all([
      Blog.find({ published: true }).select('_id updatedAt createdAt').lean(),
      News.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Event.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Farm.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Magazine.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Dairy.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Beef.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Goat.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Piggery.find({ published: true }).select('_id updatedAt createdAt').lean(),
      Basic.find({ published: true }).select('_id updatedAt createdAt').lean()
    ]);

    // Helper function to create sitemap URL
    const createSitemapUrl = (path, lastmod, changefreq = 'weekly', priority = '0.7') => {
      return `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    };

    // Static pages
    const staticUrls = [
      createSitemapUrl('/', new Date(), 'daily', '1.0'),
      createSitemapUrl('/blog', new Date(), 'daily', '0.9'),
      createSitemapUrl('/news', new Date(), 'daily', '0.9'),
      createSitemapUrl('/events', new Date(), 'weekly', '0.8'),
      createSitemapUrl('/farm', new Date(), 'weekly', '0.8'),
      createSitemapUrl('/magazines', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/dairy', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/beef', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/goats', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/piggery', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/basics', new Date(), 'weekly', '0.7'),
      createSitemapUrl('/about', new Date(), 'monthly', '0.6'),
      createSitemapUrl('/contact', new Date(), 'monthly', '0.6'),
      createSitemapUrl('/services', new Date(), 'monthly', '0.6'),
      createSitemapUrl('/suppliers', new Date(), 'monthly', '0.6')
    ].join('');

    // Dynamic content URLs
    const contentUrls = [
      ...blogs.map(item => createSitemapUrl(`/blogs/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.8')),
      ...news.map(item => createSitemapUrl(`/news/${item._id}`, item.updatedAt || item.createdAt, 'weekly', '0.8')),
      ...events.map(item => createSitemapUrl(`/events/${item._id}`, item.updatedAt || item.createdAt, 'weekly', '0.7')),
      ...farms.map(item => createSitemapUrl(`/farm/${item._id}`, item.updatedAt || item.createdAt, 'weekly', '0.7')),
      ...magazines.map(item => createSitemapUrl(`/magazines/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.6')),
      ...dairies.map(item => createSitemapUrl(`/dairy/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.7')),
      ...beefs.map(item => createSitemapUrl(`/beef/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.7')),
      ...goats.map(item => createSitemapUrl(`/goats/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.7')),
      ...piggeries.map(item => createSitemapUrl(`/piggery/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.7')),
      ...basics.map(item => createSitemapUrl(`/basics/${item._id}`, item.updatedAt || item.createdAt, 'monthly', '0.6'))
    ].join('');

    // RSS feed URLs
    const rssUrls = [
      createSitemapUrl('/api/syndication/rss/blogs', new Date(), 'daily', '0.5'),
      createSitemapUrl('/api/syndication/rss/news', new Date(), 'daily', '0.5'),
      createSitemapUrl('/api/syndication/rss/all', new Date(), 'daily', '0.5')
    ].join('');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}${contentUrls}${rssUrls}
</urlset>`;

    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
    res.send(sitemapXml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sitemap',
      error: error.message
    });
  }
};
