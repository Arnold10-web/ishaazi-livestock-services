import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import API_ENDPOINTS from '../config/apiConfig';

/**
 * Enhanced Dashboard Overview Component
 * Professional, modern dashboard with accurate statistics and improved UX
 */

const MetricCard = ({ title, value, icon, change, color, description, loading = false }) => {
  const isPositive = change >= 0;
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Background accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-100 to-${color}-50 dark:from-${color}-900 dark:to-${color}-800 rounded-full transform translate-x-16 -translate-y-16 opacity-10`}></div>
      
      <div className="relative flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            {description && (
              <div className="group relative">
                <i className="fas fa-info-circle text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help text-xs"></i>
                <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                  {description}
                </div>
              </div>
            )}
          </div>
          
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{value}</h3>
          
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-2 ${isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs`}></i>
              </div>
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-30 ml-4`}>
          <i className={`fas fa-${icon} text-${color}-600 dark:text-${color}-400 text-2xl`}></i>
        </div>
      </div>
    </div>
  );
};

const EnhancedRecentActivity = ({ activities, darkMode }) => {
  const [showAll, setShowAll] = useState(false);
  const displayActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
          <div className="w-2 h-2 bg-teal-500 rounded-full mr-3 animate-pulse"></div>
          Recent Activity
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {activities.length} activities
        </div>
      </div>

      <div className="space-y-3">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <div 
              key={index} 
              className={`flex items-start p-4 rounded-lg hover:shadow-sm transition-all duration-200 ${
                darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`p-2.5 rounded-lg mr-4 bg-${activity.color}-100 dark:bg-${activity.color}-900 dark:bg-opacity-30`}>
                <i className={`fas fa-${activity.icon} text-${activity.color}-600 dark:text-${activity.color}-400`}></i>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                    {activity.title}
                  </p>
                  {activity.status && (
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-400' 
                        : activity.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-400'
                        : activity.status === 'sent'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {activity.status}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 leading-relaxed`}>
                  {activity.description}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-clock mr-1"></i>
                  {activity.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <i className="fas fa-inbox text-2xl opacity-50"></i>
            </div>
            <p className="text-lg font-medium mb-1">No recent activities</p>
            <p className="text-sm">Activities will appear here as content is created or updated</p>
          </div>
        )}
      </div>

      {activities.length > 5 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className={`mt-4 w-full py-3 border ${
            darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          } rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center group`}
        >
          {showAll ? 'Show Less' : `View All ${activities.length} Activities`}
          <i className={`fas fa-chevron-${showAll ? 'up' : 'down'} ml-2 text-xs group-hover:translate-x-1 transition-transform duration-200`}></i>
        </button>
      )}
    </div>
  );
};

const EnhancedQuickActions = ({ actions, darkMode }) => {
  const navigate = useNavigate();
  
  const handleActionClick = (action) => {
    // Handle different action types with proper React Router navigation
    switch (action.type) {
      case 'navigate':
        if (action.path) {
          // Parse the path and handle tab-based navigation within dashboard
          if (action.path.includes('/dashboard')) {
            // Extract tab and action from query parameters
            const url = new URL(action.path, window.location.origin);
            const tab = url.searchParams.get('tab') || 'overview';
            const actionType = url.searchParams.get('action');
            
            // Navigate to dashboard and communicate tab change via URL state
            navigate('/dashboard', { 
              state: { 
                activeTab: tab,
                action: actionType,
                from: 'quickAction'
              }
            });
          } else {
            // Handle other navigation paths
            navigate(action.path);
          }
        }
        break;
      case 'modal':
        // For future modal implementations
        console.log(`Opening modal for: ${action.title}`);
        break;
      case 'external':
        if (action.url) {
          window.open(action.url, '_blank');
        }
        break;
      default:
        console.log(`Action clicked: ${action.title}`);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
        <i className="fas fa-bolt mr-2 text-amber-500"></i>
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action)}
            className={`group p-4 rounded-xl border-2 ${
              darkMode 
                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-750' 
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            } transition-all duration-200 flex flex-col items-center text-center hover:shadow-sm cursor-pointer`}
          >
            <div className={`w-14 h-14 rounded-xl mb-3 flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900 dark:bg-opacity-30 group-hover:scale-110 transition-transform duration-200`}>
              <i className={`fas fa-${action.icon} text-${action.color}-600 dark:text-${action.color}-400 text-xl`}></i>
            </div>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
              {action.title}
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const EnhancedContentDistribution = ({ data, darkMode }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
        <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
        Content Distribution
      </h3>
      
      {/* Chart Section */}
      <div className="flex flex-col space-y-6">
        <div className="h-80 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={130}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={darkMode ? 
                  { backgroundColor: "#374151", borderColor: "#6B7280", color: "#F9FAFB" } : 
                  { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", color: "#111827" }
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Content Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                } hover:shadow-sm transition-all duration-200`}
              >
                <div className="flex items-center mb-2">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                    {item.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {item.value}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {percentage}% of total
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {total > 0 && (
          <div className={`text-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-info-circle mr-1"></i>
              Total: {total} content pieces across all categories
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedContentTrend = ({ data, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
          <i className="fas fa-chart-line mr-2 text-purple-500"></i>
          Content Growth Trend
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          Last 6 months
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBlogs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorNews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
            <XAxis 
              dataKey="name" 
              stroke={darkMode ? "#9CA3AF" : "#6B7280"}
              fontSize={12}
            />
            <YAxis 
              stroke={darkMode ? "#9CA3AF" : "#6B7280"}
              fontSize={12}
            />
            <Tooltip 
              contentStyle={darkMode ? 
                { backgroundColor: "#374151", borderColor: "#6B7280", color: "#F9FAFB" } : 
                { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", color: "#111827" }
              }
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="blogs" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorBlogs)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="news" 
              stroke="#82ca9d"
              fillOpacity={1} 
              fill="url(#colorNews)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="events" 
              stroke="#ffc658"
              fillOpacity={1} 
              fill="url(#colorEvents)"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="newsletters" stroke="#ff7300" strokeWidth={2} />
            <Line type="monotone" dataKey="subscribers" stroke="#00c49f" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EnhancedPopularContent = ({ items, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm p-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
          <i className="fas fa-fire mr-2 text-red-500"></i>
          Top Performing Content
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          By views
        </div>
      </div>

      <div className="space-y-4">
        {items.length > 0 ? items.map((item, index) => {
          const isTopPerformer = index === 0;
          return (
            <div 
              key={index} 
              className={`flex items-center p-4 rounded-xl transition-all duration-200 ${
                isTopPerformer 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700'
                  : darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-4 font-bold text-lg ${
                isTopPerformer 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} truncate pr-2`}>
                    {item.title}
                  </p>
                  {isTopPerformer && (
                    <i className="fas fa-crown text-yellow-500 text-sm"></i>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${item.categoryColor}-100 text-${item.categoryColor}-800 dark:bg-${item.categoryColor}-900 dark:bg-opacity-30 dark:text-${item.categoryColor}-400`}>
                    {item.category}
                  </span>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                      <i className="fas fa-eye mr-1 text-blue-500"></i>
                      {item.views.toLocaleString()}
                    </span>
                    <div className={`flex items-center ${item.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`fas fa-arrow-${item.trend > 0 ? 'up' : 'down'} text-xs`}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <i className="fas fa-chart-bar text-2xl opacity-50"></i>
            </div>
            <p className="text-lg font-medium mb-1">No popular content yet</p>
            <p className="text-sm">Content with views will appear here</p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-info-circle mr-1"></i>
            Rankings based on total views and recent engagement
          </p>
        </div>
      )}
    </div>
  );
};

// Main Enhanced Overview Component
const EnhancedOverview = ({ darkMode }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('myAppAdminToken');
        
        const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
          setLastUpdated(new Date());
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up auto-refresh every 10 minutes instead of 5 to reduce API calls
    const interval = setInterval(fetchDashboardData, 600000);
    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (date) => {
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <MetricCard key={i} loading={true} />
          ))}
        </div>
        
        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-500'} border-l-4 p-6 rounded-lg`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
              Dashboard Error
            </h3>
            <p className={`mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, activities, contentDistribution, contentTrend, popularContent, quickActions } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Header with Last Updated */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Dashboard Overview
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            <i className="fas fa-clock mr-1"></i>
            Last updated: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={`px-4 py-2 rounded-lg border ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          } transition-all duration-200 flex items-center space-x-2`}
        >
          <i className="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Content" 
          value={stats.totalContent.value} 
          icon="file-alt" 
          change={stats.totalContent.change}
          color="blue" 
          description="All published and draft content across all categories"
        />
        <MetricCard 
          title="Active Subscribers" 
          value={stats.subscribers.value} 
          icon="users" 
          change={stats.subscribers.change}
          color="purple" 
          description="Newsletter subscribers who are currently active"
        />
        <MetricCard 
          title="Engagement Rate" 
          value={stats.engagement.value} 
          icon="chart-line" 
          change={stats.engagement.change}
          color="green" 
          description="Content views relative to total content pieces"
        />
        <MetricCard 
          title="Upcoming Events" 
          value={stats.events.value} 
          icon="calendar" 
          change={stats.events.change}
          color="amber" 
          description="Events scheduled for the future"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EnhancedContentDistribution data={contentDistribution} darkMode={darkMode} />
        <EnhancedPopularContent items={popularContent} darkMode={darkMode} />
      </div>

      {/* Content Trend Chart */}
      <EnhancedContentTrend data={contentTrend} darkMode={darkMode} />

      {/* Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EnhancedRecentActivity activities={activities} darkMode={darkMode} />
        <EnhancedQuickActions actions={quickActions} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default EnhancedOverview;
