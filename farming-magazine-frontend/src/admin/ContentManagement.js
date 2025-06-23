import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BlogForm from '../components/BlogForm';
import BlogList from '../components/BlogList';
import NewsForm from '../components/NewsForm';
import NewsList from '../components/NewsList';
import FarmForm from '../components/FarmForm';
import FarmList from '../components/FarmList';
import MagazineForm from '../components/MagazineForm';
import MagazineList from '../components/MagazineList';
import BasicForm from '../components/BasicForm';
import BasicList from '../components/BasicList';
import PiggeryForm from '../components/PiggeryForm';
import PiggeryList from '../components/PiggeryList';
import DairyForm from '../components/DairyForm';
import DairyList from '../components/DairyList';
import GoatForm from '../components/GoatForm';
import GoatList from '../components/GoatList';
import BeefForm from '../components/BeefForm';
import BeefList from '../components/BeefList';
import EventForm from '../components/EventForm';
import EventList from '../components/EventList';
import EventRegistrationList from '../components/EventRegistrationList';
import SubscriberList from '../components/SubscriberList';
import NewsletterForm from '../components/NewsletterForm';
import NewsletterList from '../components/NewsletterList';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const DELETE_ENDPOINTS = {
  blogs: 'DELETE_BLOG',
  news: 'DELETE_NEWS',
  magazines: 'DELETE_MAGAZINE',
  basics: 'DELETE_BASIC',
  farms: 'DELETE_FARM',
  piggeries: 'DELETE_PIGGERY',
  dairies: 'DELETE_DAIRY',
  goats: 'DELETE_GOAT',
  beefs: 'DELETE_BEEF',
  newsletters: 'DELETE_NEWSLETTER',
  subscribers: 'DELETE_SUBSCRIBER',
  events: 'DELETE_EVENT',
  registrations: 'DELETE_EVENT_REGISTRATION',
};

const ContentStats = ({ activeTab, content, darkMode }) => {
  // Get statistics based on active tab
  const getStats = () => {
    if (!content || !content.length) return [];
    
    switch (activeTab) {
      case 'blogs':
      case 'news':
      case 'magazines':
      case 'farms':
      case 'events':
      case 'newsletters':
        return [
          { label: 'Total Items', value: content.length, icon: 'list', color: 'teal', description: 'All content items' },
          { label: 'Published', value: content.filter(item => item.published).length, icon: 'check-circle', color: 'green', description: 'Live content' },
          { label: 'Recent (30 days)', value: content.filter(item => new Date(item.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: 'calendar-alt', color: 'blue', description: 'New content' },
          { label: 'Draft', value: content.filter(item => !item.published).length, icon: 'file-alt', color: 'yellow', description: 'Unpublished content' }
        ];
      case 'subscribers':
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth - 1 >= 0 ? currentMonth - 1 : 11;
        const currentMonthSubscribers = content.filter(item => new Date(item.createdAt).getMonth() === currentMonth).length;
        const lastMonthSubscribers = content.filter(item => new Date(item.createdAt).getMonth() === lastMonth).length;
        const growthRate = lastMonthSubscribers > 0 ? Math.round(((currentMonthSubscribers - lastMonthSubscribers) / lastMonthSubscribers) * 100) : 0;
        const growthDisplay = growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`;
        
        return [
          { label: 'Total Subscribers', value: content.length, icon: 'users', color: 'teal', description: 'All subscribers' },
          { label: 'Active', value: content.filter(item => item.isActive).length, icon: 'user-check', color: 'green', description: 'Engaged subscribers' },
          { label: 'Inactive', value: content.filter(item => !item.isActive).length, icon: 'user-slash', color: 'red', description: 'Disengaged subscribers' },
          { label: 'Growth Rate', value: growthDisplay, icon: 'chart-line', color: 'blue', description: 'Monthly growth' }
        ];
      case 'registrations':
        const currentMonthRegs = content.filter(item => new Date(item.registrationDate || item.createdAt).getMonth() === new Date().getMonth()).length;
        
        return [
          { label: 'Total Registrations', value: content.length, icon: 'user-plus', color: 'teal', description: 'All event registrations' },
          { label: 'Confirmed', value: content.filter(item => item.status === 'confirmed').length, icon: 'check-circle', color: 'green', description: 'Confirmed attendees' },
          { label: 'Pending', value: content.filter(item => item.status === 'pending').length, icon: 'clock', color: 'yellow', description: 'Awaiting confirmation' },
          { label: 'This Month', value: currentMonthRegs, icon: 'calendar-alt', color: 'blue', description: 'New registrations' }
        ];
      default:
        return [
          { label: 'Total Items', value: content.length, icon: 'list', color: 'teal', description: 'All content items' },
          { label: 'Published', value: content.filter(item => item.published).length, icon: 'check-circle', color: 'green', description: 'Live content' },
          { label: 'Recent (30 days)', value: content.filter(item => new Date(item.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: 'calendar-alt', color: 'blue', description: 'New content' },
          { label: 'Draft', value: content.filter(item => !item.published).length, icon: 'file-alt', color: 'yellow', description: 'Unpublished content' }
        ];
    }
  };

  const stats = getStats();

  // Prepare chart data based on content type
  const prepareChartData = () => {
    if (!content || !content.length) return { timeData: [], categoryData: [], engagementData: [] };

    // Time-based data (last 6 months)
    const timeData = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[month.getMonth()];
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const count = content.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= monthStart && itemDate <= monthEnd;
      }).length;

      const published = content.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= monthStart && itemDate <= monthEnd && item.published;
      }).length;

      timeData.push({
        name: monthName,
        total: count,
        published: published
      });
    }

    // Category data (for content types that have categories)
    let categoryData = [];
    if (['blogs', 'news', 'farms'].includes(activeTab) && content.length > 0) {
      const categories = {};
      content.forEach(item => {
        if (item.category) {
          categories[item.category] = (categories[item.category] || 0) + 1;
        } else {
          categories['Uncategorized'] = (categories['Uncategorized'] || 0) + 1;
        }
      });

      categoryData = Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }

    // Status data (published vs draft)
    const statusData = [
      { name: 'Published', value: content.filter(item => item.published).length },
      { name: 'Draft', value: content.filter(item => !item.published).length }
    ];

    // Engagement data (if available)
    const engagementData = [];
    if (content.some(item => item.views || item.likes || item.comments)) {
      engagementData.push(
        { name: 'Views', value: content.reduce((sum, item) => sum + (item.views || 0), 0) },
        { name: 'Likes', value: content.reduce((sum, item) => sum + (item.likes || 0), 0) },
        { name: 'Comments', value: content.reduce((sum, item) => sum + (item.comments ? item.comments.length : 0), 0) }
      );
    }

    return { timeData, categoryData, statusData, engagementData };
  };

  const { timeData, categoryData, statusData, engagementData } = prepareChartData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'} rounded-xl shadow-sm p-5 border flex items-center group hover:shadow-md transition-all duration-300 cursor-pointer`}
          >
            <div className={`${darkMode ? `bg-${stat.color}-900 bg-opacity-20` : `bg-${stat.color}-100`} p-3 rounded-full mr-4 transition-colors duration-300 group-hover:scale-110 transform`}>
              <i className={`fas fa-${stat.icon} ${darkMode ? `text-${stat.color}-400` : `text-${stat.color}-500`} text-xl transition-colors duration-300`}></i>
            </div>
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium transition-colors duration-300`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>{stat.value}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 transition-colors duration-300`}>{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {content.length > 0 && (
        <div className="space-y-6">
          {/* Time-based Chart */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border transition-colors duration-300`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300 flex items-center`}>
                <i className="fas fa-chart-line mr-2 text-teal-500"></i>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Growth Trend
              </h3>
              <div className="mt-2 sm:mt-0 flex space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-20 dark:text-blue-300">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  Total
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Published
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} 
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      borderColor: darkMode ? '#374151' : '#E5E7EB',
                      color: darkMode ? '#F9FAFB' : '#111827'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total" 
                    stroke={darkMode ? '#60A5FA' : '#3B82F6'} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="published" 
                    name="Published" 
                    stroke={darkMode ? '#34D399' : '#10B981'} 
                    strokeWidth={2}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Chart */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border transition-colors duration-300`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 transition-colors duration-300 flex items-center`}>
                <i className="fas fa-chart-pie mr-2 text-purple-500"></i>
                {categoryData.length > 0 ? 'Category Distribution' : 'Content Status'}
              </h3>
              <div className="h-72 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.length > 0 ? categoryData : statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={30}
                      paddingAngle={5}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(categoryData.length > 0 ? categoryData : statusData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} items`, name]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        color: darkMode ? '#F9FAFB' : '#111827'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Chart or Status Chart */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border transition-colors duration-300`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 transition-colors duration-300 flex items-center`}>
                <i className="fas fa-chart-bar mr-2 text-amber-500"></i>
                {engagementData.length > 0 ? 'Engagement Metrics' : 'Content Status'}
              </h3>
              <div className="h-72 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  {engagementData.length > 0 ? (
                    <BarChart
                      data={engagementData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="name" tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                      <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          borderColor: darkMode ? '#374151' : '#E5E7EB',
                          color: darkMode ? '#F9FAFB' : '#111827'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Count" fill={darkMode ? '#F59E0B' : '#D97706'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        innerRadius={30}
                        paddingAngle={5}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} items`, name]}
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          borderColor: darkMode ? '#374151' : '#E5E7EB',
                          color: darkMode ? '#F9FAFB' : '#111827'
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContentManagement = ({ activeTab, darkMode }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [formVisible, setFormVisible] = useState(false);
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Fetch content based on active tab
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = API_ENDPOINTS[`GET_ADMIN_${activeTab.toUpperCase()}`];
      const response = await axios.get(endpoint, {
        headers: getAuthHeader(),
      });
      
      // Handle special cases for different response structures
      if (activeTab === 'beefs' && response.data.data && response.data.data.beefs) {
        setContent(response.data.data.beefs || []);
      } else if (activeTab === 'newsletters' && response.data.data && response.data.data.newsletters) {
        setContent(response.data.data.newsletters || []);
      } else if (activeTab === 'subscribers' && response.data.data && response.data.data.subscribers) {
        setContent(response.data.data.subscribers || []);
      } else if (activeTab === 'registrations' && response.data.data && response.data.data.registrations) {
        setContent(response.data.data.registrations || []);
      } else {
        setContent(response.data[activeTab] || []); // Fallback to empty array
      }
      
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Failed to fetch ${activeTab}. Please try again later.`);
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContent();
    // Reset form visibility and other states when tab changes
    setFormVisible(false);
    setEditingItem(null);
    setSearchTerm('');
    setSortField('createdAt');
    setSortDirection('desc');
    setFilters({});
    setSelectedItems([]);
    setShowFilters(false);
  }, [fetchContent, activeTab]);
  
  // Notification system
  const showNotificationMessage = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };
  
  // Filter and sort content
  const filteredAndSortedContent = useMemo(() => {
    if (!content.length) return [];
    
    // First apply search
    let result = content;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item => {
        // Search in title, description, content, category, etc.
        return (
          (item.title && item.title.toLowerCase().includes(lowerSearchTerm)) ||
          (item.description && item.description.toLowerCase().includes(lowerSearchTerm)) ||
          (item.content && item.content.toLowerCase().includes(lowerSearchTerm)) ||
          (item.category && item.category.toLowerCase().includes(lowerSearchTerm)) ||
          (item.email && item.email.toLowerCase().includes(lowerSearchTerm)) ||
          (item.firstName && item.firstName.toLowerCase().includes(lowerSearchTerm)) ||
          (item.lastName && item.lastName.toLowerCase().includes(lowerSearchTerm)) ||
          (item.company && item.company.toLowerCase().includes(lowerSearchTerm)) ||
          (item.status && item.status.toLowerCase().includes(lowerSearchTerm))
        );
      });
    }
    
    // Then apply filters
    if (Object.keys(filters).length) {
      result = result.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value || value === 'all') return true;
          
          if (key === 'isPublished') {
            return value === 'published' ? item.published : !item.published;
          }
          
          if (key === 'category') {
            return item.category === value;
          }
          
          if (key === 'dateRange') {
            const itemDate = new Date(item.createdAt);
            const today = new Date();
            
            if (value === 'today') {
              return itemDate.toDateString() === today.toDateString();
            } else if (value === 'week') {
              const weekAgo = new Date(today.setDate(today.getDate() - 7));
              return itemDate >= weekAgo;
            } else if (value === 'month') {
              const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
              return itemDate >= monthAgo;
            }
          }
          
          return true;
        });
      });
    }
    
    // Finally sort
    return [...result].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle dates
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Handle undefined values
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Sort direction
      return sortDirection === 'asc' 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }, [content, searchTerm, filters, sortField, sortDirection]);
  
  // Get available categories for filter
  const availableCategories = useMemo(() => {
    if (!content.length) return [];
    const categories = new Set();
    content.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories);
  }, [content]);
  
  // Toggle item selection for batch operations
  const toggleItemSelection = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Select/deselect all items
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredAndSortedContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAndSortedContent.map(item => item._id));
    }
  };
  
  // Batch operations
  const handleBatchOperation = async (operation) => {
    if (!selectedItems.length) {
      showNotificationMessage('warning', 'No items selected');
      return;
    }
    
    try {
      if (operation === 'delete') {
        // Confirm deletion
        if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
          // In a real implementation, you would use a batch delete API endpoint
          // For now, we'll delete items one by one
          for (const id of selectedItems) {
            await handleDelete(id);
          }
          showNotificationMessage('success', `${selectedItems.length} items deleted successfully`);
          setSelectedItems([]);
        }
      } else if (operation === 'publish' || operation === 'unpublish') {
        // In a real implementation, you would use a batch update API endpoint
        // This is a simplified example
        const isPublished = operation === 'publish';
        const updatedItems = [];
        
        for (const id of selectedItems) {
          const item = content.find(item => item._id === id);
          if (item) {
            // Update the item
            const updatedItem = { ...item, isPublished };
            // In a real implementation, you would call your API here
            updatedItems.push(updatedItem);
          }
        }
        
        // Update the local state with the updated items
        // In a real implementation, you would refetch the content
        showNotificationMessage('success', `${selectedItems.length} items ${isPublished ? 'published' : 'unpublished'} successfully`);
        fetchContent(); // Refetch to get updated data
        setSelectedItems([]);
      }
    } catch (err) {
      console.error(`Error performing batch operation:`, err);
      showNotificationMessage('error', 'Failed to perform batch operation');
    }
  };
  
  // Export functionality
  const handleExport = () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const dataToExport = filteredAndSortedContent.map(item => {
        // Remove unnecessary fields and format data for export
        const { __v, _id, ...rest } = item;
        return {
          ...rest,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
          status: item.published ? 'Published' : 'Draft'
        };
      });
      
      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      ).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showNotificationMessage('success', `${dataToExport.length} items exported successfully`);
    } catch (err) {
      console.error('Error exporting data:', err);
      showNotificationMessage('error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortField('createdAt');
    setSortDirection('desc');
    setShowFilters(false);
  };

  // Edit handler for updating content
  const handleUpdate = (id) => {
    const itemToEdit = content.find((item) => item._id === id);
    setEditingItem(itemToEdit);
    setFormVisible(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const deleteKey = DELETE_ENDPOINTS[activeTab];
      if (!deleteKey) {
        throw new Error(`No delete endpoint configured for ${activeTab}`);
      }
      // Call the corresponding endpoint function from API_ENDPOINTS with the provided id
      const endpoint = API_ENDPOINTS[deleteKey](id);
      await axios.delete(endpoint, { headers: getAuthHeader() });
      fetchContent();
    } catch (err) {
      console.error(`Error deleting ${activeTab}:`, err);
      setError(`Failed to delete ${activeTab}. Please try again.`);
    }
  };

  // Delete handler for removing a specific comment
  const handleDeleteComment = async (basicId, commentId) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_COMMENT(basicId, commentId), {
        headers: getAuthHeader(),
      });
      fetchContent();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  // Close form and reset editing item
  const handleFormClose = () => {
    setFormVisible(false);
    setEditingItem(null);
  };

  // Toggle between add mode and view mode
  const toggleForm = () => {
    if (editingItem) {
      setEditingItem(null);
    }
    setFormVisible(!formVisible);
  };

  // Notification component
  const Notification = () => {
    if (!showNotification) return null;
    
    const bgColors = {
      success: darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-500',
      error: darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-500',
      warning: darkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-800' : 'bg-yellow-50 border-yellow-500',
      info: darkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800' : 'bg-blue-50 border-blue-500'
    };
    
    const textColors = {
      success: darkMode ? 'text-green-400' : 'text-green-700',
      error: darkMode ? 'text-red-400' : 'text-red-700',
      warning: darkMode ? 'text-yellow-400' : 'text-yellow-700',
      info: darkMode ? 'text-blue-400' : 'text-blue-700'
    };
    
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${bgColors[notification.type]} border-l-4 p-4 rounded-md shadow-lg max-w-md transform transition-all duration-300 ease-in-out animate-slideInRight`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <i className={`fas fa-${icons[notification.type]} ${textColors[notification.type]}`}></i>
          </div>
          <div className="ml-3">
            <p className={`text-sm ${textColors[notification.type]}`}>{notification.message}</p>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            className={`ml-auto -mx-1.5 -my-1.5 ${textColors[notification.type]} rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 hover:bg-gray-100 hover:bg-opacity-20`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    );
  };
  
  // Loading state with improved animation
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 relative">
          <div className={`w-16 h-16 border-4 ${darkMode ? 'border-gray-700' : 'border-teal-100'} border-dashed rounded-full animate-spin`}></div>
          <div className="w-16 h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-teal-600'} font-medium`}>Loading {activeTab}...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-md shadow-md`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-circle text-red-500"></i>
        </div>
        <div className="ml-3">
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
        </div>
        <button 
          onClick={() => setError(null)}
          className="ml-auto -mx-1.5 -my-1.5 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 inline-flex h-8 w-8 hover:bg-red-100 hover:bg-opacity-20"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const commonProps = {
      apiBaseUrl,
      isAdmin: true,
      onDelete: handleDelete,
      onEdit: handleUpdate,
      viewMode: viewMode,
    };

    const getFormComponent = () => {
      switch (activeTab) {
        case 'blogs':
          return (
            <BlogForm 
              refreshBlogs={fetchContent} 
              editingBlog={editingItem}
              setEditingBlog={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'news':
          return (
            <NewsForm 
              refreshNews={fetchContent} 
              editingNews={editingItem}
              setEditingNews={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'farms':
          return (
            <FarmForm 
              refreshFarms={fetchContent} 
              editingFarm={editingItem}
              setEditingFarm={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'magazines':
          return (
            <MagazineForm 
              refreshMagazines={fetchContent} 
              editingMagazine={editingItem}
              setEditingMagazine={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'basics':
          return (
            <BasicForm 
              refreshBasics={fetchContent} 
              editingBasic={editingItem}
              setEditingBasic={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'piggeries':
          return (
            <PiggeryForm 
              refreshPiggeries={fetchContent} 
              editingPiggery={editingItem}
              setEditingPiggery={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'dairies':
          return (
            <DairyForm 
              refreshDairies={fetchContent} 
              editingDairy={editingItem}
              setEditingDairy={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'goats':
          return (
            <GoatForm 
              refreshGoats={fetchContent} 
              editingGoat={editingItem}
              setEditingGoat={setEditingItem}
              onClose={handleFormClose}
            />
          );
        case 'beefs':
          return (
            <BeefForm 
              refreshBeefs={fetchContent} 
              editingBeef={editingItem}
              setEditingBeef={setEditingItem}
              onClose={handleFormClose}
            />
          );
          case 'events':
            return (
              <EventForm 
                refreshEvents={fetchContent}
                editingEvent={editingItem}
                setEditingEvent={setEditingItem}
                onClose={handleFormClose}
              />
            );
        case 'newsletters':
          return (
            <NewsletterForm
              refreshNewsletters={fetchContent}
              editingNewsletter={editingItem}
              setEditingNewsletter={setEditingItem}
              onClose={handleFormClose}
              darkMode={darkMode}
            />
          );
        default:
          return null;
      }
    };

    const getListComponent = () => {
      switch (activeTab) {
        case 'blogs':
          return <BlogList blogs={filteredAndSortedContent} {...commonProps} />;
        case 'news':
          return <NewsList news={filteredAndSortedContent} {...commonProps} />;
        case 'farms':
          return <FarmList farms={filteredAndSortedContent} {...commonProps} />;
        case 'magazines':
          return <MagazineList magazines={filteredAndSortedContent} {...commonProps} />;
        case 'basics':
          return (
            <BasicList 
              basics={filteredAndSortedContent} 
              onDeleteComment={handleDeleteComment}
              {...commonProps}
            />
          );
        case 'piggeries':
          return <PiggeryList piggeries={filteredAndSortedContent} {...commonProps} />;
        case 'dairies':
          return <DairyList dairies={filteredAndSortedContent} {...commonProps} />;
        case 'goats':
          return <GoatList goats={filteredAndSortedContent} {...commonProps} />;
        case 'events':
            return <EventList events={filteredAndSortedContent} {...commonProps} />;
        case 'beefs':
          return <BeefList beefs={filteredAndSortedContent} {...commonProps} />;
        case 'newsletters':
          return <NewsletterList newsletters={filteredAndSortedContent} {...commonProps} darkMode={darkMode} />;
        case 'subscribers':
          return <SubscriberList subscribers={filteredAndSortedContent} onDelete={handleDelete} darkMode={darkMode} />;
        case 'registrations':
          return <EventRegistrationList registrations={filteredAndSortedContent} onDelete={handleDelete} darkMode={darkMode} selectedItems={selectedItems} onToggleSelect={toggleItemSelection} />;
        default:
          return <div>Select a content type to manage</div>;
      }
    };
    
    return (
      <div>
        {/* Stats Cards */}
        <ContentStats activeTab={activeTab} content={content} />
        
        {/* Action Bar */}
        <div className="space-y-4 mb-6">
          {/* Top Row - Add New, Search, and View Toggle */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Add New Button (not for subscribers or registrations) */}
              {activeTab !== 'subscribers' && activeTab !== 'registrations' && (
                <button
                  onClick={toggleForm}
                  className={`${
                    formVisible 
                      ? `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'}` 
                      : `${darkMode ? 'bg-teal-700 hover:bg-teal-600' : 'bg-teal-600 hover:bg-teal-700'}`
                  } text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200 flex items-center`}
                >
                  <i className={`fas fa-${formVisible ? 'times' : 'plus'} mr-2`}></i>
                  {formVisible ? 'Cancel' : 'Add New'}
                </button>
              )}
              
              {/* Batch Operations - Only show when items are selected */}
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedItems.length} selected
                  </span>
                  <div className="flex space-x-1">
                    {activeTab !== 'subscribers' && activeTab !== 'registrations' && (
                      <>
                        <button
                          onClick={() => handleBatchOperation('publish')}
                          className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-100 hover:bg-green-200 text-green-800'} transition duration-200 text-sm font-medium`}
                          title="Publish selected items"
                        >
                          <i className="fas fa-check-circle mr-1"></i> Publish
                        </button>
                        <button
                          onClick={() => handleBatchOperation('unpublish')}
                          className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'} transition duration-200 text-sm font-medium`}
                          title="Unpublish selected items"
                        >
                          <i className="fas fa-eye-slash mr-1"></i> Unpublish
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleBatchOperation('delete')}
                      className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'} transition duration-200 text-sm font-medium`}
                      title="Delete selected items"
                    >
                      <i className="fas fa-trash-alt mr-1"></i> Delete
                    </button>
                    <button
                      onClick={() => setSelectedItems([])}
                      className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition duration-200 text-sm font-medium`}
                      title="Clear selection"
                    >
                      <i className="fas fa-times mr-1"></i> Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Search Box */}
              <div className={`relative ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 focus:border-teal-500' : 'bg-white border-gray-300 text-gray-700 focus:border-teal-500'} rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-200 w-48 md:w-64`}
                />
                <div className="absolute left-3 top-2.5">
                  <i className="fas fa-search"></i>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              
              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting || content.length === 0}
                className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} transition duration-200 text-sm font-medium flex items-center ${(isExporting || content.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Export to CSV"
              >
                <i className={`fas fa-${isExporting ? 'spinner fa-spin' : 'file-export'} mr-1`}></i> Export
              </button>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`py-2 px-3 rounded-lg ${showFilters ? (darkMode ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800') : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')} transition duration-200 text-sm font-medium flex items-center`}
                title="Toggle filters"
              >
                <i className="fas fa-filter mr-1"></i> Filter
              </button>
              
              {/* View Mode Toggle */}
              <div className={`flex space-x-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-1 rounded-lg`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`py-1 px-3 rounded ${darkMode ? 
                    (viewMode === 'grid' ? 'bg-gray-800 shadow-sm text-teal-400' : 'text-gray-300 hover:text-white') :
                    (viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700')
                  } transition duration-200`}
                >
                  <i className="fas fa-th-large mr-1"></i> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`py-1 px-3 rounded ${darkMode ? 
                    (viewMode === 'list' ? 'bg-gray-800 shadow-sm text-teal-400' : 'text-gray-300 hover:text-white') :
                    (viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700')
                  } transition duration-200`}
                >
                  <i className="fas fa-list mr-1"></i> List
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 animate-fadeIn shadow-sm`}>
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <i className="fas fa-sliders-h mr-2 text-purple-500"></i> Advanced Filters
                </h3>
                <button
                  onClick={resetFilters}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <i className="fas fa-redo mr-1"></i> Reset Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                {activeTab !== 'subscribers' && activeTab !== 'registrations' && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                    <select
                      value={filters.isPublished || 'all'}
                      onChange={(e) => setFilters({...filters, isPublished: e.target.value})}
                      className={`w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                )}
                
                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                    <select
                      value={filters.category || 'all'}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className={`w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Date Range Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date Range</label>
                  <select
                    value={filters.dateRange || 'all'}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className={`w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
                
                {/* Sort Options */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className={`w-full py-2 px-3 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="updatedAt">Date Updated</option>
                    <option value="title">Title</option>
                    {activeTab === 'subscribers' && <option value="email">Email</option>}
                    {activeTab === 'registrations' && <option value="email">Email</option>}
                    {activeTab === 'registrations' && <option value="firstName">First Name</option>}
                    {activeTab === 'registrations' && <option value="lastName">Last Name</option>}
                    {activeTab === 'registrations' && <option value="status">Status</option>}
                    {['blogs', 'news', 'farms'].includes(activeTab) && <option value="category">Category</option>}
                  </select>
                </div>
                
                {/* Sort Direction */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort Direction</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSortDirection('asc')}
                      className={`flex-1 py-2 px-3 rounded-lg ${sortDirection === 'asc' ? 
                        (darkMode ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800 border-teal-500') : 
                        (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300')} 
                        border transition duration-200`}
                    >
                      <i className="fas fa-arrow-up mr-1"></i> Ascending
                    </button>
                    <button
                      onClick={() => setSortDirection('desc')}
                      className={`flex-1 py-2 px-3 rounded-lg ${sortDirection === 'desc' ? 
                        (darkMode ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800 border-teal-500') : 
                        (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300')} 
                        border transition duration-200`}
                    >
                      <i className="fas fa-arrow-down mr-1"></i> Descending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Results Summary */}
          <div className={`flex justify-between items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            <div>
              {searchTerm && (
                <span className="mr-2">Search results for: <span className="font-medium">"{searchTerm}"</span></span>
              )}
              <span>Showing <span className="font-medium">{filteredAndSortedContent.length}</span> of <span className="font-medium">{content.length}</span> items</span>
            </div>
            {Object.keys(filters).length > 0 && (
              <div className="flex items-center">
                <span className="mr-2">Filters applied</span>
                <button 
                  onClick={resetFilters}
                  className={`text-xs ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-2 py-1 rounded-full`}
                >
                  <i className="fas fa-times mr-1"></i> Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        {formVisible && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mb-6 rounded-xl shadow-sm border animate-fadeIn transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-700'} flex items-center`}>
                <i className={`fas fa-${editingItem ? 'edit' : 'plus-circle'} mr-2 text-teal-500`}></i>
                {editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
              </h3>
              <button 
                onClick={handleFormClose}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} p-2 rounded-full hover:bg-gray-100 hover:bg-opacity-20 transition-all duration-200`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="relative">
              {getFormComponent()}
            </div>
          </div>
        )}

        {/* List/Grid Section */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl shadow-sm border transition-colors duration-300`}>
          {filteredAndSortedContent.length > 0 ? (
            <>
              {/* Select All Checkbox for Batch Operations */}
              {content.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedItems.length === filteredAndSortedContent.length && filteredAndSortedContent.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="select-all" className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select All
                    </label>
                  </div>
                  
                  {/* Item Count */}
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {filteredAndSortedContent.length} {filteredAndSortedContent.length === 1 ? activeTab.slice(0, -1) : activeTab}
                  </div>
                </div>
              )}
              
              {/* Pass the filtered and sorted content and selection handlers to the list component */}
              {React.cloneElement(getListComponent(), {
                [activeTab]: filteredAndSortedContent,
                selectedItems,
                onToggleSelect: toggleItemSelection,
                darkMode
              })}
            </>
          ) : (
            <div className="text-center py-12">
              <div className={`text-6xl ${darkMode ? 'text-gray-700' : 'text-gray-300'} mb-4`}>
                {searchTerm || Object.keys(filters).length > 0 ? (
                  <i className="fas fa-search"></i>
                ) : (
                  <i className="fas fa-inbox"></i>
                )}
              </div>
              {searchTerm || Object.keys(filters).length > 0 ? (
                <>
                  <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No results found</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Try adjusting your search or filters</p>
                  <button
                    onClick={resetFilters}
                    className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-700'} font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200`}
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Reset Filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No {activeTab} found</h3>
                  {activeTab !== 'subscribers' && activeTab !== 'registrations' && (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Get started by creating a new {activeTab.slice(0, -1)}</p>
                  )}
                  {activeTab !== 'subscribers' && activeTab !== 'registrations' && !formVisible && (
                    <button
                      onClick={toggleForm}
                      className={`${darkMode ? 'bg-teal-700 hover:bg-teal-600' : 'bg-teal-600 hover:bg-teal-700'} text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200`}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add {activeTab.slice(0, -1)}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Notification Component */}
        <Notification />
      </div>
    );
  };

  return renderContent();
};

export default ContentManagement;