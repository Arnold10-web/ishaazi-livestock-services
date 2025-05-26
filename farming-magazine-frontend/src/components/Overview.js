import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

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
    popularContent: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data - in a real app, this would come from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch this data from your API
        // For now we'll use mock data for demonstration
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // These would be API calls in the real implementation
        // const response = await axios.get(API_ENDPOINTS.GET_DASHBOARD_STATS, { headers: getAuthHeader() });
        // setDashboardData(response.data);
        
        // Mock data for demonstration
        setDashboardData({
          stats: {
            totalContent: { value: 246, change: 12.5 },
            subscribers: { value: 1853, change: 8.3 },
            engagement: { value: "73%", change: -2.1 },
            events: { value: 15, change: 20 }
          },
          activities: [
            { icon: 'edit', color: 'blue', title: 'Blog Updated', description: 'Modern Dairy Farming Techniques', time: '10 minutes ago', status: 'published' },
            { icon: 'plus', color: 'green', title: 'New Event Created', description: 'Annual Livestock Exhibition 2025', time: '2 hours ago', status: 'draft' },
            { icon: 'trash', color: 'red', title: 'Content Deleted', description: 'Outdated farming guide', time: '5 hours ago' },
            { icon: 'user-plus', color: 'purple', title: 'New Subscriber', description: 'subscriber@example.com', time: 'Yesterday' }
          ],
          quickActions: [
            { icon: 'file-alt', color: 'blue', title: 'New Blog Post', description: 'Create content' },
            { icon: 'newspaper', color: 'green', title: 'Add News Item', description: 'Post updates' },
            { icon: 'calendar-plus', color: 'purple', title: 'Schedule Event', description: 'Plan ahead' },
            { icon: 'paper-plane', color: 'amber', title: 'Send Newsletter', description: 'Reach subscribers' }
          ],
          contentDistribution: [
            { name: 'Blogs', value: 42 },
            { name: 'News', value: 58 },
            { name: 'Farms', value: 34 },
            { name: 'Events', value: 15 },
            { name: 'Magazines', value: 28 },
            { name: 'Other', value: 69 }
          ],
          contentTrend: [
            { name: 'Jan', blogs: 4, news: 3, events: 1 },
            { name: 'Feb', blogs: 7, news: 4, events: 1 },
            { name: 'Mar', blogs: 5, news: 6, events: 2 },
            { name: 'Apr', blogs: 10, news: 8, events: 3 },
            { name: 'May', blogs: 12, news: 12, events: 5 },
            { name: 'Jun', blogs: 14, news: 15, events: 3 }
          ],
          popularContent: [
            { title: 'Top 10 Dairy Farm Management Tips', category: 'Blog', categoryColor: 'blue', views: 5283, trend: 1 },
            { title: 'Upcoming Livestock Exhibition 2025', category: 'Event', categoryColor: 'purple', views: 4192, trend: 1 },
            { title: 'New Government Subsidies for Farmers', category: 'News', categoryColor: 'green', views: 3547, trend: 1 },
            { title: 'Best Practices for Goat Rearing', category: 'Magazine', categoryColor: 'amber', views: 2871, trend: -1 },
            { title: 'Advanced Piggery Management', category: 'Blog', categoryColor: 'blue', views: 2315, trend: 1 }
          ]
        });
        
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

  const { stats, activities, quickActions, contentDistribution, contentTrend, popularContent } = dashboardData;

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
          <QuickActions actions={dashboardData.quickActions} darkMode={darkMode} />
        </div>
        <div>
          <PopularContent items={popularContent} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default Overview;