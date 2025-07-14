import React from 'react';
import { Link } from 'react-router-dom';
import { Rss, Download, Globe, FileText, BookOpen, Newspaper, Calendar } from 'lucide-react';

const RSSFeeds = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const feeds = [
    {
      id: 'blogs',
      title: 'Blog Articles',
      description: 'Latest farming insights, tips, and agricultural innovations',
      url: `${API_BASE_URL}/api/syndication/rss/blogs`,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      id: 'news',
      title: 'Latest News',
      description: 'Breaking news and updates from the agricultural industry',
      url: `${API_BASE_URL}/api/syndication/rss/news`,
      icon: Newspaper,
      color: 'bg-green-500'
    },
    {
      id: 'all',
      title: 'All Content',
      description: 'Complete feed of all content including blogs, news, events, and more',
      url: `${API_BASE_URL}/api/syndication/rss/all`,
      icon: Globe,
      color: 'bg-purple-500'
    }
  ];

  const sitemapUrl = `${API_BASE_URL}/api/syndication/sitemap.xml`;

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
    alert('RSS feed URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Rss className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RSS Feeds & Syndication
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest content from Ishaazi Livestock Services. 
            Subscribe to our RSS feeds or integrate our content into your applications.
          </p>
        </div>

        {/* RSS Feeds Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Available RSS Feeds
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {feeds.map((feed) => {
              const IconComponent = feed.icon;
              return (
                <div
                  key={feed.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 ${feed.color} rounded-lg mr-4`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {feed.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      {feed.description}
                    </p>
                    
                    <div className="space-y-3">
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                      >
                        <Rss className="w-4 h-4 mr-2" />
                        Subscribe to Feed
                      </a>
                      
                      <button
                        onClick={() => handleCopyUrl(feed.url)}
                        className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copy Feed URL
                      </button>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {feed.url}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sitemap Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            XML Sitemap
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-indigo-500 rounded-lg mr-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    XML Sitemap
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Complete sitemap of all pages and content for search engines and web crawlers.
                </p>
                
                <div className="space-y-3">
                  <a
                    href={sitemapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    View Sitemap
                  </a>
                  
                  <button
                    onClick={() => handleCopyUrl(sitemapUrl)}
                    className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copy Sitemap URL
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-mono break-all">
                    {sitemapUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How to Use RSS Feeds
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                For Readers
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Copy the RSS feed URL you want to follow
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Add it to your RSS reader (Feedly, Inoreader, etc.)
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Get notified when new content is published
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                For Developers
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Use our RSS feeds to integrate content into your apps
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Parse the XML to extract articles and metadata
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Submit our sitemap to search engines for better SEO
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Popular RSS Readers */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Popular RSS Readers
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['Feedly', 'Inoreader', 'NewsBlur', 'The Old Reader', 'Feedbin'].map((reader) => (
              <span
                key={reader}
                className="bg-white px-4 py-2 rounded-full shadow-sm text-gray-700 border"
              >
                {reader}
              </span>
            ))}
          </div>
          
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSSFeeds;
