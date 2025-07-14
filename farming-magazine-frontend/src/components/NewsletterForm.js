import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import useAutoSave from '../hooks/useAutoSave';

const NewsletterForm = ({ refreshNewsletters, editingNewsletter, setEditingNewsletter, onClose, darkMode }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetSubscriptionTypes, setTargetSubscriptionTypes] = useState(['all']);
  const [featured, setFeatured] = useState(false);
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

  // Define resetFormFields first
  const resetFormFields = useCallback(() => {
    setTitle('');
    setSubject('');
    setTargetSubscriptionTypes(['all']);
    setFeatured(false);
    if (quillEditor) {
      quillEditor.setText('');
    }
  }, [quillEditor]);

  // Initialize Quill editor
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
      
      // If we have editing data, populate it after editor is initialized
      if (editingNewsletter) {
        editor.root.innerHTML = editingNewsletter.body || '';
      }
    }
  }, [quillEditor, editingNewsletter]);

  // Initialize editor on mount
  useEffect(() => {
    initializeQuill();

    return () => {
      if (quillEditor) {
        quillEditor.off('text-change');
      }
    };
  }, [initializeQuill, quillEditor]);

  // Populate form when editing newsletter changes
  useEffect(() => {
    console.log('NewsletterForm: editingNewsletter changed:', editingNewsletter);
    if (editingNewsletter) {
      console.log('NewsletterForm: Setting form fields with data:', {
        title: editingNewsletter.title,
        subject: editingNewsletter.subject,
        body: editingNewsletter.body,
        targetSubscriptionTypes: editingNewsletter.targetSubscriptionTypes,
        featured: editingNewsletter.featured
      });
      
      setTitle(editingNewsletter.title || '');
      setSubject(editingNewsletter.subject || editingNewsletter.title || '');
      setTargetSubscriptionTypes(editingNewsletter.targetSubscriptionTypes || ['all']);
      setFeatured(editingNewsletter.featured || false);
      
      // Set editor content if editor is already initialized
      if (quillEditor) {
        console.log('NewsletterForm: Setting Quill editor content');
        quillEditor.root.innerHTML = editingNewsletter.body || '';
      } else {
        console.log('NewsletterForm: Quill editor not ready yet');
      }
    } else {
      console.log('NewsletterForm: Clearing form fields');
      // Clear form when not editing
      resetFormFields();
    }
  }, [editingNewsletter, quillEditor, resetFormFields]);

  const resetForm = () => {
    resetFormFields();
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
      targetSubscriptionTypes,
      featured
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

  // Auto-save form data
  const formData = {
    title,
    subject,
    targetSubscriptionTypes,
    featured,
    body: quillEditor ? quillEditor.root.innerHTML : ''
  };

  const storageKey = `newsletter_form_${editingNewsletter?._id || 'new'}`;
  
  const {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
    clearSaved
  } = useAutoSave(formData, storageKey, null, {
    autoSaveInterval: 30000, // 30 seconds
    debounceDelay: 2000, // 2 seconds
    enableLocalStorage: true,
    enableServerSave: false,
    onSaveSuccess: () => console.log('Newsletter auto-saved to localStorage'),
    onSaveError: (error) => console.error('Newsletter auto-save failed:', error)
  });

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

        {/* Featured Newsletter */}
        <div>
          <label className={`flex items-center cursor-pointer`}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={featured}
                onChange={() => setFeatured(!featured)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Featured content
              </span>
            </div>
            <div className={`ml-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {featured 
                ? 'This newsletter will be highlighted as a featured newsletter.' 
                : 'Check to mark this newsletter as featured.'}
            </div>
          </label>
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

        {/* Auto-save status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-600 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {isSaving && (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Auto-saving...</span>
                </div>
              )}
              {!isSaving && lastSaved && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
                </div>
              )}
              {hasUnsavedChanges && !isSaving && (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={manualSave}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </button>
            )}
            
            <button
              type="button"
              onClick={clearSaved}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center text-sm dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Draft
            </button>
          </div>
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
