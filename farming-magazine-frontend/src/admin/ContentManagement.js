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

const ContentManagement = ({ activeTab }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

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
  }, [fetchContent]);

  // Edit handler for updating content
  const handleUpdate = (id) => {
    const itemToEdit = content.find((item) => item._id === id);
    setEditingItem(itemToEdit);
  };

  
  // Delete handler for removing content
  const handleDelete = async (id) => {
    try {
      const endpoint = API_ENDPOINTS[`DELETE_${activeTab.toUpperCase().slice(0, -1)}`](id);
      await axios.delete(endpoint, { headers: getAuthHeader() });
      fetchContent();
    } catch (err) {
      console.error(`Error deleting ${activeTab.slice(0, -1)}:`, err);
      setError(`Failed to delete ${activeTab.slice(0, -1)}. Please try again.`);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const renderContent = () => {
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const commonProps = {
      apiBaseUrl,
      isAdmin: true,
      onDelete: handleDelete,
      onEdit: handleUpdate,
    };

    switch (activeTab) {
      case 'blogs':
        return (
          <>
            <BlogForm 
              refreshBlogs={fetchContent} 
              editingBlog={editingItem}
              setEditingBlog={setEditingItem}
            />
            <BlogList blogs={content} {...commonProps} />
          </>
        );
        case 'news':
          return (
            <>
             <NewsForm 
              refreshNews={fetchContent} 
              editingNews={editingItem}
              setEditingNews={setEditingItem}
            />
            <NewsList news={content} {...commonProps} />
            </>
          );
        
      case 'farms':
        return (
          <>
            <FarmForm 
              refreshFarms={fetchContent} 
              editingFarm={editingItem}
              setEditingFarm={setEditingItem}
            />
            <FarmList farms={content} {...commonProps} />
          </>
        );
      case 'magazines':
        return (
          <>
            <MagazineForm 
              refreshMagazines={fetchContent} 
              editingMagazine={editingItem}
              setEditingMagazine={setEditingItem}
            />
            <MagazineList magazines={content} {...commonProps} />
          </>
        );
      case 'basics': // Basics management
        return (
          <>
            <BasicForm 
              refreshBasics={fetchContent} 
              editingBasic={editingItem}
              setEditingBasic={setEditingItem}
            />
            <BasicList 
              basics={content} 
              onDeleteComment={handleDeleteComment} // Pass comment deletion handler
              {...commonProps}
            />
          </>
          );
           case 'piggeries':
            return (
              <>
                <PiggeryForm 
                  refreshPiggeries={fetchContent} 
                  editingPiggery={editingItem}
                  setEditingPiggery={setEditingItem}
                />
                <PiggeryList piggeries={content} {...commonProps} />
              </>
            );
          case 'dairies':
            return (
              <>
                <DairyForm 
                  refreshDairies={fetchContent} 
                  editingDairy={editingItem}
                  setEditingDairy={setEditingItem}
                />
                <DairyList dairies={content} {...commonProps} />
              </>
            );
          case 'goats':
            return (
              <>
                <GoatForm 
                  refreshGoats={fetchContent} 
                  editingGoat={editingItem}
                  setEditingGoat={setEditingItem}
                />
                <GoatList goats={content} {...commonProps} />
              </>
            );

          case 'beefs':
            return (
              <>
                <BeefForm 
                  refreshBeefs={fetchContent} 
                  editingBeef={editingItem}
                  setEditingBeef={setEditingItem}
                />
                <BeefList beefs={content} {...commonProps} />
              </>
            );
            case 'newsletters': // Newsletter Management
            return (
              <>
                <NewsletterForm
                  refreshNewsletters={fetchContent}
                  editingNewsletter={editingItem}
                  setEditingNewsletter={setEditingItem}
                />
                <NewsletterList newsletters={content} {...commonProps} />
              </>
            );
    
          case 'subscribers': // Subscriber Management
            return (
              <>
                <SubscriberList
                  subscribers={content}
                  onDelete={handleDelete}
                />
              </>
            );
      default:
        return <div>Select a content type to manage</div>;
    }
  };

  return (
    <div>
      <h2>{`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management`}</h2>
      {renderContent()}
    </div>
  );
};

export default ContentManagement;
