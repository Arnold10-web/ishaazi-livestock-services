import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const NewsletterForm = ({ refreshNewsletters, editingNewsletter, setEditingNewsletter, onClose, darkMode }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetSubscriptionTypes, setTargetSubscriptionTypes] = useState(['all']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  const subscriptionTypeOptions = [
    { value: 'all', label: 'All Subscribers', description: 'Send to everyone' },
    { value: 'newsletters', label: 'Newsletter Subscribers', description: 'Regular newsletter recipients' },
    { value: 'events', label: 'Event Subscribers', description: 'Event notification recipients' },
    { value: 'auctions', label: 'Auction Subscribers', description: 'Livestock auction updates' },
    { value: 'farming-tips', label: 'Farming Tips', description: 'Agricultural advice subscribers' },
    { value: 'livestock-updates', label: 'Livestock Updates', description: 'Animal care and management' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (editingNewsletter) {
      setTitle(editingNewsletter.title || '');
      setSubject(editingNewsletter.subject || editingNewsletter.title || '');
      setTargetSubscriptionTypes(editingNewsletter.targetSubscriptionTypes || ['all']);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingNewsletter.body || '';
      }
    }
  }, [editingNewsletter, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your newsletter content here...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['blockquote', 'code-block'],
            ['clean']
          ],
        },
      });
      setQuillEditor(editor);
    }
  }, [quillEditor]);

  useEffect(() => {
    initializeQuill();

    return () => {
      if (quillEditor) {
        quillEditor.off('text-change');
      }
    };
  }, [initializeQuill, quillEditor]);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setTargetSubscriptionTypes(['all']);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingNewsletter(null);
    setError('');
    if (onClose) onClose();
  };

  const handleTargetTypeChange = (type) => {
    if (type === 'all') {
      setTargetSubscriptionTypes(['all']);
    } else {
      const newTypes = targetSubscriptionTypes.includes('all') 
        ? [type]
        : targetSubscriptionTypes.includes(type)
          ? targetSubscriptionTypes.filter(t => t !== type)
          : [...targetSubscriptionTypes, type];
      
      setTargetSubscriptionTypes(newTypes.length === 0 ? ['all'] : newTypes);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = quillEditor ? quillEditor.root.innerHTML : '';

    // Validate required fields
    if (!title.trim() || !subject.trim() || !body.trim()) {
      setError('Title, subject, and content are required.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = { 
      title: title.trim(), 
      subject: subject.trim(),
      body,
      targetSubscriptionTypes
    };

    try {
      if (editingNewsletter) {
        await axios.put(`${API_ENDPOINTS.UPDATE_NEWSLETTER(editingNewsletter._id)}`, formData, {
          headers: getAuthHeader(),
        });
        showNotification('Newsletter updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_NEWSLETTER, formData, {
          headers: getAuthHeader(),
        });
        showNotification('Newsletter created successfully!');
      }
      refreshNewsletters();
      resetForm();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      setError(error.response?.data?.message || 'Failed to save newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!editingNewsletter) {
      setError('You can only send an existing newsletter. Save it first!');
      return;
    }

    if (editingNewsletter.status === 'sent') {
      setError('This newsletter has already been sent.');
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send "${editingNewsletter.title}" to ${
        targetSubscriptionTypes.includes('all') ? 'all subscribers' : 
        targetSubscriptionTypes.join(', ') + ' subscribers'
      }? This action cannot be undone.`
    );

    if (!confirmSend) return;

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.SEND_NEWSLETTER(editingNewsletter._id), {}, {
        headers: getAuthHeader(),
      });
      showNotification(`Newsletter sent successfully! ${response.data.data?.sent || 0} emails sent.`);
      refreshNewsletters();
      resetForm();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setError(error.response?.data?.message || 'Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        } border-l-4`}>
          <div className="flex items-center">
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <i className="fas fa-newspaper mr-2 text-blue-500"></i>
            {editingNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={resetForm}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {/* Newsletter Status */}
        {editingNewsletter && (
          <div className={`p-4 rounded-lg border ${
            editingNewsletter.status === 'sent' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <i className={`fas fa-${editingNewsletter.status === 'sent' ? 'check-circle' : 'clock'} mr-2`}></i>
              <span className="font-medium">
                Status: {editingNewsletter.status?.charAt(0).toUpperCase() + editingNewsletter.status?.slice(1) || 'Draft'}
              </span>
              {editingNewsletter.sentAt && (
                <span className="ml-2 text-sm">
                  • Sent on {new Date(editingNewsletter.sentAt).toLocaleDateString()}
                </span>
              )}
              {editingNewsletter.sentTo && (
                <span className="ml-2 text-sm">
                  • {editingNewsletter.sentTo} recipients
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title Field */}
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
            Newsletter Title *
          </label>
          <input
            type="text"
            placeholder="Enter newsletter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
            disabled={loading}
          />
        </div>

        {/* Subject Field */}
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
            Email Subject *
          </label>
          <input
            type="text"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
            disabled={loading}
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>
            Target Audience
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscriptionTypeOptions.map((option) => (
              <label key={option.value} className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-opacity-50 ${
                targetSubscriptionTypes.includes(option.value)
                  ? darkMode 
                    ? 'bg-blue-900 border-blue-600' 
                    : 'bg-blue-50 border-blue-300'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={targetSubscriptionTypes.includes(option.value)}
                  onChange={() => handleTargetTypeChange(option.value)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
            Newsletter Content *
          </label>
          <div
            ref={quillRef}
            className={`bg-white border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
            style={{ height: '300px', marginBottom: '1rem' }}
          ></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingNewsletter ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <i className={`fas fa-${editingNewsletter ? 'save' : 'plus'} mr-2`}></i>
                {editingNewsletter ? 'Update Newsletter' : 'Create Newsletter'}
              </>
            )}
          </button>

          {editingNewsletter && editingNewsletter.status !== 'sent' && (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Send Newsletter
            </button>
          )}

          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className={`px-6 py-3 border font-medium rounded-lg transition-colors ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsletterForm;
