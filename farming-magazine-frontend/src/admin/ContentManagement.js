import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/apiConfig';
import '../css/contentmanagement.css';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [contentList, setContentList] = useState([]);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editId, setEditId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const endpointMap = {
    news: { fetch: API_ENDPOINTS.GET_NEWS, create: API_ENDPOINTS.CREATE_NEWS, delete: API_ENDPOINTS.DELETE_NEWS },
    blogs: { fetch: API_ENDPOINTS.GET_BLOGS, create: API_ENDPOINTS.CREATE_BLOG, delete: API_ENDPOINTS.DELETE_BLOG },
    farms: { fetch: API_ENDPOINTS.GET_FARMS, create: API_ENDPOINTS.CREATE_FARM, delete: API_ENDPOINTS.DELETE_FARM },
  };

  // Load content based on the active tab
  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpointMap[activeTab].fetch);
      const data = await response.json();
      setContentList(data);
      setStatusMessage('');
    } catch (error) {
      console.error('Error fetching content:', error);
      setStatusMessage('Error loading content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setStatusMessage('Please fill out all fields.');
      return;
    }

    const endpoint = editId ? `${endpointMap[activeTab].create}/${editId}` : endpointMap[activeTab].create;
    const method = editId ? 'PUT' : 'POST';

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchContent();
        setFormData({ title: '', content: '' });
        setEditId(null);
        setStatusMessage(`${activeTab.slice(0, -1)} ${editId ? 'updated' : 'created'} successfully!`);
      } else {
        setStatusMessage('Error saving content.');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setStatusMessage('Error saving content.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content) => {
    setFormData({ title: content.title, content: content.content });
    setEditId(content._id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${endpointMap[activeTab].delete}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchContent();
        setStatusMessage(`${activeTab.slice(0, -1)} deleted successfully!`);
      } else {
        setStatusMessage('Error deleting content.');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      setStatusMessage('Error deleting content.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-management container">
      <h2>Content Management</h2>

      <nav className="content-tabs">
        {Object.keys(endpointMap).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        ></textarea>
        <button type="submit" disabled={loading}>
          {editId ? 'Update' : 'Add'} {activeTab.slice(0, -1)}
        </button>
      </form>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {loading ? (
        <p>Loading content...</p>
      ) : (
        <ul className="content-list">
          {contentList.map((content) => (
            <li key={content._id} className="content-item">
              <h3>{content.title}</h3>
              <p>{content.content}</p>
              <button onClick={() => handleEdit(content)}>Edit</button>
              <button onClick={() => handleDelete(content._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContentManagement;
