// Advanced search analytics dashboard for administrators
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SearchAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [analyticsResponse, performanceResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/search/analytics?timeRange=${timeRange}`),
        fetch(`${API_BASE_URL}/api/search/performance/metrics`)
      ]);

      if (!analyticsResponse.ok || !performanceResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analytics = await analyticsResponse.json();
      const performance = await performanceResponse.json();

      setAnalyticsData(analytics.data);
      setPerformanceData(performance.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Reset performance metrics
  const resetPerformanceMetrics = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/search/performance/reset`, {
        method: 'POST'
      });
      fetchAnalyticsData();
    } catch (err) {
      console.error('Error resetting metrics:', err);
    }
  };

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      analytics: analyticsData,
      performance: performanceData,
      exportedAt: new Date().toISOString(),
      timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
        <p className="text-red-800">Error loading analytics: {error}</p>
        <button
          onClick={fetchAnalyticsData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Search Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor search performance and user behavior
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={exportAnalytics}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <Search className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Searches
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {analyticsData?.summary?.totalSearches?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Unique Terms
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {analyticsData?.summary?.uniqueSearchTerms?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Results
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {Math.round(analyticsData?.summary?.avgResultsPerSearch || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {performanceData?.averageResponseTime ? 
                  `${Math.round(performanceData.averageResponseTime)}ms` : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Trends Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData?.searchTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="searchCount" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Searches */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Search Terms
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.topSearches?.slice(0, 8) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      {performanceData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Metrics
            </h3>
            <button
              onClick={resetPerformanceMetrics}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset Metrics
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Requests Processed</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {performanceData.totalRequests?.toLocaleString() || 0}
              </p>
            </div>
            
            <div className="text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {performanceData.averageResponseTime ? 
                  `${Math.round(performanceData.averageResponseTime)}ms` : 'N/A'}
              </p>
            </div>
            
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Error Rate</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {performanceData.errorRate ? 
                  `${(performanceData.errorRate * 100).toFixed(2)}%` : '0%'}
              </p>
            </div>
          </div>
          
          {/* Response Time Distribution */}
          {performanceData.responseTimeHistogram && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Response Time Distribution
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceData.responseTimeHistogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {/* Zero Results Searches */}
      {analyticsData?.zeroResultSearches?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            Searches with No Results
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analyticsData.zeroResultSearches.map((search, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  "{search.searchTerm}"
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(search.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchAnalyticsDashboard;
