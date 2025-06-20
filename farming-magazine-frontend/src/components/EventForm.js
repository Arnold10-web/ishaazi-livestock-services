/**
 * EventForm Component
 * 
 * Form component for creating and editing farming event listings.
 * Features rich text editing for event descriptions, image upload,
 * date/time selection, and comprehensive metadata management.
 * 
 * @module components/EventForm
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

/**
 * Form component for creating and editing agricultural events
 * 
 * @param {Object} props - Component props
 * @param {Function} props.refreshEvents - Callback to refresh events list after submission
 * @param {Object|null} props.editingEvent - Event object being edited, null for new events
 * @param {Function} props.setEditingEvent - Function to clear editing state
 * @returns {JSX.Element} Rendered event form component
 */
const EventForm = ({ refreshEvents, editingEvent, setEditingEvent }) => {
  // Core event details
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  
  // User-friendly fields for metadata
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('Conference');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  
  // Rich text editor references
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  /**
   * Populates form fields when editing an existing event
   * Handles date formatting and metadata extraction
   */
  useEffect(() => {
    if (editingEvent) {
      // Set core event properties
      setTitle(editingEvent.title);
      setImagePreview(editingEvent.imageUrl);
      
      // Format dates for datetime-local input
      setStartDate(editingEvent.startDate ? new Date(editingEvent.startDate).toISOString().slice(0, 16) : '');
      setEndDate(editingEvent.endDate ? new Date(editingEvent.endDate).toISOString().slice(0, 16) : '');
      
      setLocation(editingEvent.location || '');
      setPublished(editingEvent.published !== false);
      
      // Extract user-friendly fields from metadata
      const metadata = editingEvent.metadata || {};
      setOrganizer(metadata.organizer || '');
      setCategory(metadata.category || 'Conference');
      
      // Handle array or string fields for tags and keywords
      setTags(metadata.tags ? (Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags) : '');
      setKeywords(metadata.keywords ? (Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords) : '');
      setSummary(metadata.summary || '');
      
      // Set rich text editor content if editor is initialized
      if (quillEditor) {
        quillEditor.root.innerHTML = editingEvent.description;
      }
    }
  }, [editingEvent, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your event details here...',
        modules: {
          toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']],
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setImage(null);
    setImagePreview(null);
    setStartDate('');
    setEndDate('');
    setLocation('');
    setOrganizer('');
    setCategory('Conference');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingEvent(null);
  };

  // Generate metadata from user-friendly fields
  const generateMetadata = () => {
    const metadata = {};
    if (organizer.trim()) metadata.organizer = organizer.trim();
    if (category.trim()) metadata.category = category.trim();
    if (tags.trim()) metadata.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (summary.trim()) metadata.summary = summary.trim();
    return metadata;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title.trim() || !description.trim() || !startDate) {
      setError('Title, description, and start date are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('metadata', JSON.stringify(generateMetadata()));
    formData.append('startDate', startDate);
    formData.append('published', published);
    if (endDate) formData.append('endDate', endDate);
    if (location) formData.append('location', location);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingEvent) {
        await axios.put(API_ENDPOINTS.UPDATE_EVENT(editingEvent._id), formData, {
          headers: { ...getAuthHeader() },
        });
        alert('Event updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_EVENT, formData, {
          headers: { ...getAuthHeader() },
        });
        alert('Event created successfully!');
      }
      refreshEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.response?.data?.message || 'Failed to save event');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6">
        <h3 className="text-2xl font-bold text-white">
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md dark:bg-red-900/30 dark:border-red-400" role="alert">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Event Title
          </label>
          <input
            id="event-title"
            type="text"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-required="true"
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date and Time
            </label>
            <input
              id="event-start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date and Time
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Optional</span>
            </label>
            <input
              id="event-end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Optional</span>
          </label>
          <input
            id="event-location"
            type="text"
            placeholder="Enter event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
          />
        </div>

        {/* User-friendly metadata fields */}
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Event Details</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="event-organizer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Organizer
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Optional</span>
              </label>
              <input
                id="event-organizer"
                type="text"
                placeholder="e.g., AgriTech Solutions"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                id="event-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Exhibition">Exhibition</option>
                <option value="Training">Training</option>
                <option value="Networking">Networking</option>
                <option value="Competition">Competition</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="event-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Comma separated</span>
              </label>
              <input
                id="event-tags"
                type="text"
                placeholder="e.g., agriculture, technology, farming"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="event-keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SEO Keywords
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Comma separated</span>
              </label>
              <input
                id="event-keywords"
                type="text"
                placeholder="e.g., farming event, agricultural conference"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="event-summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Summary
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Brief description for previews</span>
            </label>
            <textarea
              id="event-summary"
              placeholder="A brief summary of the event for previews and social media..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="event-published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="event-published" className="text-sm text-gray-700 dark:text-gray-300">
              Publish event immediately
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Event will be visible on the website</span>
            </label>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="event-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Event Image
          </label>
          <div className="flex items-center space-x-2">
            <input 
              type="file" 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
              id="event-image"
            />
            <label 
              htmlFor="event-image" 
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors duration-200 cursor-pointer flex items-center dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose Image
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {image ? image.name : 'No file chosen'}
            </span>
          </div>
          
          {imagePreview && (
            <div className="mt-4 relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-64 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm" 
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Event Description
          </label>
          <div 
            className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
          >
            <div ref={quillRef} className="h-72 bg-white dark:bg-gray-700"></div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 pt-4">
          <button 
            type="submit" 
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {editingEvent ? 'Update Event' : 'Publish Event'}
          </button>
          
          {editingEvent && (
            <button 
              type="button" 
              onClick={resetForm} 
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventForm;