import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import API_ENDPOINTS from '../config/apiConfig';

const OverviewCard = ({ title, value, icon, change, color }) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
          {change !== undefined && (
            <p className={`mt-2 text-sm font-medium flex items-center ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1`}></i>
              {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-20`}>
          <i className={`fas fa-${icon} text-${color}-500 text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-history mr-2 text-teal-500"></i>Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className={`flex items-start p-3 rounded-lg ${index % 2 === 0 ? darkMode ? 'bg-gray-700' : 'bg-gray-50' : ''}`}
            >
              <div className={`p-2 rounded-full mr-3 bg-${activity.color}-100 dark:bg-${activity.color}-900 dark:bg-opacity-20`}>
                <i className={`fas fa-${activity.icon} text-${activity.color}-500`}></i>
              </div>
              <div className="flex-1">
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{activity.title}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.description}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{activity.time}</p>
              </div>
              {activity.status && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400' 
                    : activity.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400'
                }`}>
                  {activity.status}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
            <p>No recent activities</p>
          </div>
        )}
      </div>
      <button className={`mt-4 w-full py-2 border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} rounded-lg transition text-sm font-medium flex items-center justify-center`}>
        View All Activity <i className="fas fa-chevron-right ml-2 text-xs"></i>
      </button>
    </div>
  );
};

const QuickActions = ({ actions, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-bolt mr-2 text-amber-500"></i>Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-all duration-200 flex flex-col items-center text-center`}
          >
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900 dark:bg-opacity-20`}>
              <i className={`fas fa-${action.icon} text-${action.color}-500 text-lg`}></i>
            </div>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{action.title}</span>
            <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ContentDistribution = ({ data, darkMode }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-chart-pie mr-2 text-blue-500"></i>Content Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ContentTrend = ({ data, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-chart-line mr-2 text-purple-500"></i>Content Growth Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#eee"} />
            <XAxis dataKey="name" stroke={darkMode ? "#aaa" : "#666"} />
            <YAxis stroke={darkMode ? "#aaa" : "#666"} />
            <Tooltip 
              contentStyle={darkMode ? 
                { backgroundColor: "#333", borderColor: "#555", color: "#fff" } : 
                { backgroundColor: "#fff", borderColor: "#ddd", color: "#333" }
              } 
            />
            <Legend />
            <Line type="monotone" dataKey="blogs" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="news" stroke="#82ca9d" />
            <Line type="monotone" dataKey="events" stroke="#ffc658" />
            <Line type="monotone" dataKey="newsletters" stroke="#ff7300" />
            <Line type="monotone" dataKey="subscribers" stroke="#00c49f" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PopularContent = ({ items, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-fire mr-2 text-red-500"></i>Most Popular Content
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center p-3 rounded-lg ${index % 2 === 0 ? darkMode ? 'bg-gray-700' : 'bg-gray-50' : ''}`}
          >
            <div className="text-xl font-bold mr-4 w-8 text-center text-gray-400">{index + 1}</div>
            <div className="flex-1">
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {item.title}
              </p>
              <div className="flex items-center mt-1">
                <span className={`text-xs px-2 py-1 rounded-full bg-${item.categoryColor}-100 text-${item.categoryColor}-800 dark:bg-${item.categoryColor}-900 dark:bg-opacity-20 dark:text-${item.categoryColor}-400 mr-2`}>
                  {item.category}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className="fas fa-eye mr-1"></i> {item.views} views
                </span>
              </div>
            </div>
            <div className={`text-${item.trend > 0 ? 'green' : 'red'}-500`}>
              <i className={`fas fa-arrow-${item.trend > 0 ? 'up' : 'down'}`}></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Newsletter Analytics Widget
const NewsletterAnalytics = ({ metrics, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-envelope mr-2 text-indigo-500"></i>Newsletter Performance
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sent</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {metrics?.sentNewsletters || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
              <i className="fas fa-paper-plane text-green-500"></i>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Draft</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {metrics?.draftNewsletters || 0}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
              <i className="fas fa-edit text-yellow-500"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Open Rate</span>
          <div className="flex items-center">
            <div className={`w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3`}>
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: metrics?.openRate || '0%' }}
              ></div>
            </div>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {metrics?.openRate || '0%'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Click Rate</span>
          <div className="flex items-center">
            <div className={`w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3`}>
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: metrics?.clickRate || '0%' }}
              ></div>
            </div>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {metrics?.clickRate || '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subscriber Analytics Widget
const SubscriberAnalytics = ({ metrics, distribution, darkMode }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <i className="fas fa-users mr-2 text-cyan-500"></i>Subscriber Insights
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {metrics?.activeSubscribers || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
              <i className="fas fa-user-check text-green-500"></i>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Growth</p>
              <p className={`text-2xl font-bold ${metrics?.subscriberGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics?.subscriberGrowth >= 0 ? '+' : ''}{metrics?.subscriberGrowth || 0}%
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
              <i className={`fas fa-arrow-${metrics?.subscriberGrowth >= 0 ? 'up' : 'down'} text-blue-500`}></i>
            </div>
          </div>
        </div>
      </div>

      {distribution && distribution.length > 0 && (
        <div className="h-48">
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Subscription Types
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} subscribers`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const Overview = ({ darkMode = false }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalContent: { value: 0, change: 0 },
      subscribers: { value: 0, change: 0 },
      engagement: { value: 0, change: 0 },
      events: { value: 0, change: 0 }
    },
    activities: [],
    contentDistribution: [],
    contentTrend: [],
    popularContent: [],
    newsletterMetrics: {},
    subscriberDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get authentication token
        const token = localStorage.getItem('myAppAdminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching dashboard data with token:', token ? 'Token found' : 'No token');
        console.log('API Endpoint:', API_ENDPOINTS.DASHBOARD_STATS);

        // Fetch real dashboard statistics from API
        const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response data:', result);
        console.log('Stats received:', result.data?.stats);
        console.log('Activities count:', result.data?.activities?.length);
        console.log('Content distribution:', result.data?.contentDistribution);
        console.log('Popular content with views:', result.data?.popularContent);
        
        if (result.success) {
          setDashboardData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 relative">
          <div className={`w-16 h-16 border-4 ${darkMode 
            ? 'border-gray-700' 
            : 'border-teal-100'} border-dashed rounded-full animate-spin`}></div>
          <div className="w-16 h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-md`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div className="ml-3">
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { stats, activities, contentDistribution, contentTrend, popularContent, newsletterMetrics, subscriberDistribution } = dashboardData;
  const quickActions = dashboardData.quickActions || [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard 
          title="Total Content" 
          value={stats.totalContent.value} 
          icon="file-alt" 
          change={stats.totalContent.change}
          color="blue" 
          darkMode={darkMode}
        />
        <OverviewCard 
          title="Subscribers" 
          value={stats.subscribers.value} 
          icon="users" 
          change={stats.subscribers.change}
          color="purple" 
          darkMode={darkMode}
        />
        <OverviewCard 
          title="Engagement Rate" 
          value={stats.engagement.value} 
          icon="chart-line" 
          change={stats.engagement.change}
          color="green" 
          darkMode={darkMode}
        />
        <OverviewCard 
          title="Upcoming Events" 
          value={stats.events.value} 
          icon="calendar" 
          change={stats.events.change}
          color="amber" 
          darkMode={darkMode}
        />
      </div>
      
      {/* Newsletter and Subscriber Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewsletterAnalytics metrics={newsletterMetrics} darkMode={darkMode} />
        <SubscriberAnalytics 
          metrics={newsletterMetrics} 
          distribution={subscriberDistribution} 
          darkMode={darkMode} 
        />
      </div>
      
      {/* Content and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentTrend data={contentTrend} darkMode={darkMode} />
        </div>
        <div>
          <RecentActivity activities={activities} darkMode={darkMode} />
        </div>
      </div>
      
      {/* Distribution and Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <ContentDistribution data={contentDistribution} darkMode={darkMode} />
        </div>
        <div>
          <QuickActions actions={quickActions} darkMode={darkMode} />
        </div>
        <div>
          <PopularContent items={popularContent} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default Overview;