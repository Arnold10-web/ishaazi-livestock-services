import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Enhanced Statistics Summary Component
 * Provides detailed analytics without comment system data
 */
const StatisticsSummary = ({ darkMode }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('myAppAdminToken');
      
      const response = await fetch('/api/dashboard/clean-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Unable to load statistics</p>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-30`}>
          <i className={`fas fa-${icon} text-${color}-600 dark:text-${color}-400`}></i>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Content"
          value={stats.overview.totalContent}
          subtitle="Across all categories"
          icon="file-alt"
          color="blue"
        />
        <StatCard 
          title="Total Views"
          value={stats.overview.totalViews.toLocaleString()}
          subtitle={`Avg: ${stats.overview.avgViews} per content`}
          icon="eye"
          color="green"
        />
        <StatCard 
          title="Engagement Rate"
          value={stats.overview.engagementRate}
          subtitle="Views per content ratio"
          icon="chart-line"
          color="purple"
        />
        <StatCard 
          title="Content with Views"
          value={stats.overview.contentWithViews}
          subtitle={`${((stats.overview.contentWithViews / stats.overview.totalContent) * 100).toFixed(1)}% of total`}
          icon="star"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Content Distribution
          </h3>
          <div className="space-y-3">
            {stats.quality.contentDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.type}
                </span>
                <div className="flex items-center space-x-3">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.count}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Data Quality
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                Content without views
              </span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.quality.contentWithoutViews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                Avg views per content
              </span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.quality.avgViewsPerContent}
              </span>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900 dark:bg-opacity-20">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                Comments excluded from statistics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Top Performing Blogs
          </h3>
          <div className="space-y-3">
            {stats.performance.topBlogs.slice(0, 5).map((blog, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {blog.title}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {blog.category} • {blog.ageInDays} days old
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {blog.views}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Top Performing News
          </h3>
          <div className="space-y-3">
            {stats.performance.topNews.slice(0, 5).map((news, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {news.title}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {news.category} • {news.ageInDays} days old
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {news.views}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Content Creation Trends (Last 6 Months)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
              <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
              <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
              <Tooltip 
                contentStyle={darkMode ? 
                  { backgroundColor: "#374151", borderColor: "#6B7280", color: "#F9FAFB" } : 
                  { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", color: "#111827" }
                }
              />
              <Line type="monotone" dataKey="blogs" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="news" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="events" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Monthly View Trends
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
              <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
              <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
              <Tooltip 
                contentStyle={darkMode ? 
                  { backgroundColor: "#374151", borderColor: "#6B7280", color: "#F9FAFB" } : 
                  { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", color: "#111827" }
                }
              />
              <Bar dataKey="totalViews" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: 'chart-pie' },
          { id: 'performance', label: 'Performance', icon: 'trophy' },
          { id: 'trends', label: 'Trends', icon: 'chart-line' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeView === tab.id
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <i className={`fas fa-${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'performance' && renderPerformance()}
      {activeView === 'trends' && renderTrends()}

      {/* Data Quality Notice */}
      <div className={`${darkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
        <div className="flex items-center">
          <i className="fas fa-info-circle text-blue-500 mr-3"></i>
          <div>
            <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
              Enhanced Statistics (v2.0)
            </p>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'} mt-1`}>
              Comment system removed for accurate engagement metrics. 
              Generated at: {new Date(stats.meta.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsSummary;
