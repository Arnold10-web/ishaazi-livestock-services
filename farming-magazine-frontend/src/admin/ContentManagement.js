import React, { useState } from 'react';
import BlogForm from '../components/BlogForm';
import BlogList from '../components/BlogList';
import NewsForm from '../components/NewsForm'; // News component
import NewsList from '../components/NewsList'; // News component

const ContentManagement = ({ activeTab }) => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const refreshContent = () => setRefreshFlag(!refreshFlag);

  const renderContentTab = () => {
    switch (activeTab) {
      case 'blogs':
        return (
          <div>
            <BlogForm refreshBlogs={refreshContent} />
            <BlogList key={refreshFlag} />
          </div>
        );
      case 'news':
          return (
            <div>
              <NewsForm refreshNews={refreshContent} />
              <NewsList key={refreshFlag} />
            </div>
          );
      case 'media':
        return <p>Media management will go here.</p>; // Add media logic here
      case 'magazines':
        return <p>Magazine management will go here.</p>; // Add magazines logic here
      case 'farms':
        return <p>Farms management will go here.</p>; // Add farms logic here
      default:
        return <p>Select a tab to manage content.</p>;
    }
  };

  return (
    <div className="content-management">
      <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h2>
      {renderContentTab()}
    </div>
  );
};

export default ContentManagement;
