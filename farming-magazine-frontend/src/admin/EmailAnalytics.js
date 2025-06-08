import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import {
  Mail,
  TrendingUp,
  Users,
  MousePointer,
  Eye,
  Activity
} from 'lucide-react';

const EmailAnalytics = ({ darkMode = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [newsletterAnalytics, setNewsletterAnalytics] = useState(null);
  const [newsletters, setNewsletters] = useState([]);

  const fetchOverallAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_ENDPOINTS.EMAIL_OVERALL_ANALYTICS}?timeframe=${timeframe}`,
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchOverallAnalytics();
    fetchNewsletters();
  }, [fetchOverallAnalytics]);

  const fetchNewsletters = async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.GET_NEWSLETTERS,
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        const sentNewsletters = response.data.data.newsletters.filter(n => n.status === 'sent');
        setNewsletters(sentNewsletters);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    }
  };

  const fetchNewsletterAnalytics = async (newsletterId) => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.EMAIL_NEWSLETTER_ANALYTICS(newsletterId),
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        setNewsletterAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching newsletter analytics:', error);
    }
  };

  const handleNewsletterSelect = (newsletter) => {
    setSelectedNewsletter(newsletter);
    fetchNewsletterAnalytics(newsletter._id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend = null }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                     rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-500 font-medium">{trend}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 shadow-sm`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading analytics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📧 Email Analytics
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor newsletter performance and subscriber engagement
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeframe === option.value
                  ? 'bg-blue-600 text-white'
                  : darkMode 
                    ? 'text-gray-300 hover:bg-gray-600' 
                    : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Mail}
              title="Newsletters Sent"
              value={analytics.newsletters.sent}
              subtitle={`To ${analytics.newsletters.totalRecipients} recipients`}
              color="blue"
            />
            <StatCard
              icon={Eye}
              title="Open Rate"
              value={analytics.newsletters.openRate}
              subtitle={`${analytics.newsletters.totalOpens} total opens`}
              color="green"
            />
            <StatCard
              icon={MousePointer}
              title="Click Rate"
              value={analytics.newsletters.clickRate}
              subtitle={`${analytics.newsletters.totalClicks} total clicks`}
              color="purple"
            />
            <StatCard
              icon={Users}
              title="Active Subscribers"
              value={analytics.subscribers.active}
              subtitle={`${analytics.subscribers.total} total subscribers`}
              color="amber"
            />
          </div>

          {/* Newsletter Selection */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                           rounded-lg border p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Newsletter Performance
            </h3>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Newsletter
              </label>
              <select
                value={selectedNewsletter?._id || ''}
                onChange={(e) => {
                  const newsletter = newsletters.find(n => n._id === e.target.value);
                  if (newsletter) handleNewsletterSelect(newsletter);
                }}
                className={`w-full p-2 border rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Choose a newsletter...</option>
                {newsletters.map((newsletter) => (
                  <option key={newsletter._id} value={newsletter._id}>
                    {newsletter.title} - {formatDate(newsletter.sentAt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Individual Newsletter Analytics */}
            {newsletterAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Recipients
                    </span>
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {newsletterAnalytics.sentTo}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Sent on {formatDate(newsletterAnalytics.sentAt)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Opens
                    </span>
                    <Eye className="h-4 w-4 text-green-500" />
                  </div>
                  <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {newsletterAnalytics.openCount}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {newsletterAnalytics.openRate} open rate
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Clicks
                    </span>
                    <MousePointer className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {newsletterAnalytics.clickCount}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {newsletterAnalytics.clickRate} click rate
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Engagement Insights */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                           rounded-lg border p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Subscriber Engagement Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Emails Sent
                </h4>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analytics.subscribers.engagement.totalEmailsReceived}
                </p>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Overall Engagement
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Opens:
                    </span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analytics.subscribers.engagement.totalOpens}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Clicks:
                    </span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analytics.subscribers.engagement.totalClicks}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailAnalytics;
