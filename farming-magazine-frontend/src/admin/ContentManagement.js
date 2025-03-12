import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
};

const ContentStats = ({ activeTab, content }) => {
  // Get statistics based on active tab
  const getStats = () => {
    if (!content || !content.length) return [];
    
    switch (activeTab) {
      case 'blogs':
      case 'news':
      case 'magazines':
      case 'farms':
      case 'newsletters':
        return [
          { label: 'Total Items', value: content.length, icon: 'list', color: 'teal' },
          { label: 'Published', value: content.filter(item => item.isPublished).length, icon: 'check-circle', color: 'green' },
          { label: 'Recent (30 days)', value: content.filter(item => new Date(item.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: 'calendar-alt', color: 'blue' }
        ];
      case 'subscribers':
        return [
          { label: 'Total Subscribers', value: content.length, icon: 'users', color: 'teal' },
          { label: 'Active', value: content.filter(item => item.isActive).length, icon: 'user-check', color: 'green' },
          { label: 'Inactive', value: content.filter(item => !item.isActive).length, icon: 'user-slash', color: 'red' }
        ];
      default:
        return [
          { label: 'Total Items', value: content.length, icon: 'list', color: 'teal' },
          { label: 'Published', value: content.filter(item => item.isPublished).length, icon: 'check-circle', color: 'green' },
          { label: 'Recent (30 days)', value: content.filter(item => new Date(item.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: 'calendar-alt', color: 'blue' }
        ];
    }
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 flex items-center">
          <div className={`bg-${stat.color}-100 p-3 rounded-full mr-4`}>
            <i className={`fas fa-${stat.icon} text-${stat.color}-500 text-xl`}></i>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const ContentManagement = ({ activeTab }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [formVisible, setFormVisible] = useState(false);

  // Fetch content based on active tab
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = API_ENDPOINTS[`GET_ADMIN_${activeTab.toUpperCase()}`];
      const response = await axios.get(endpoint, {
        headers: getAuthHeader(),
      });
      setContent(response.data[activeTab] || []); // Fallback to empty array
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Failed to fetch ${activeTab}. Please try again later.`);
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContent();
    // Reset form visibility when tab changes
    setFormVisible(false);
    setEditingItem(null);
  }, [fetchContent, activeTab]);

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-teal-500 font-medium">Loading {activeTab}...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-circle text-red-500"></i>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
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
        case 'newsletters':
          return (
            <NewsletterForm
              refreshNewsletters={fetchContent}
              editingNewsletter={editingItem}
              setEditingNewsletter={setEditingItem}
              onClose={handleFormClose}
            />
          );
        default:
          return null;
      }
    };

    const getListComponent = () => {
      switch (activeTab) {
        case 'blogs':
          return <BlogList blogs={content} {...commonProps} />;
        case 'news':
          return <NewsList news={content} {...commonProps} />;
        case 'farms':
          return <FarmList farms={content} {...commonProps} />;
        case 'magazines':
          return <MagazineList magazines={content} {...commonProps} />;
        case 'basics':
          return (
            <BasicList 
              basics={content} 
              onDeleteComment={handleDeleteComment}
              {...commonProps}
            />
          );
        case 'piggeries':
          return <PiggeryList piggeries={content} {...commonProps} />;
        case 'dairies':
          return <DairyList dairies={content} {...commonProps} />;
        case 'goats':
          return <GoatList goats={content} {...commonProps} />;
        case 'beefs':
          return <BeefList beefs={content} {...commonProps} />;
        case 'newsletters':
          return <NewsletterList newsletters={content} {...commonProps} />;
        case 'subscribers':
          return <SubscriberList subscribers={content} onDelete={handleDelete} />;
        default:
          return <div>Select a content type to manage</div>;
      }
    };
    
    return (
      <div>
        {/* Stats Cards */}
        <ContentStats activeTab={activeTab} content={content} />
        
        {/* Action Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          {/* Add New Button (not for subscribers) */}
          {activeTab !== 'subscribers' && (
            <button
              onClick={toggleForm}
              className={`${
                formVisible 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-teal-600 hover:bg-teal-700'
              } text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200 flex items-center`}
            >
              <i className={`fas fa-${formVisible ? 'times' : 'plus'} mr-2`}></i>
              {formVisible ? 'Cancel' : 'Add New'}
            </button>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`py-1 px-3 rounded ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              } transition duration-200`}
            >
              <i className="fas fa-th-large mr-1"></i> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`py-1 px-3 rounded ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              } transition duration-200`}
            >
              <i className="fas fa-list mr-1"></i> List
            </button>
          </div>
        </div>

        {/* Form Section */}
        {formVisible && (
          <div className="bg-white p-6 mb-6 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                {editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
              </h3>
              <button 
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {getFormComponent()}
          </div>
        )}

        {/* List/Grid Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {content.length > 0 ? (
            getListComponent()
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">
                <i className="fas fa-inbox"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No {activeTab} found</h3>
              {activeTab !== 'subscribers' && (
                <p className="text-gray-500 mb-4">Get started by creating a new {activeTab.slice(0, -1)}</p>
              )}
              {activeTab !== 'subscribers' && !formVisible && (
                <button
                  onClick={toggleForm}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add {activeTab.slice(0, -1)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return renderContent();
};

export default ContentManagement;