/**
 * DairyForm Component
 * 
 * Form component for creating and editing dairy farming content.
 * Features rich text editing with Quill, image upload and preview,
 * and comprehensive metadata management for dairy farming articles.
 * 
 * @module components/DairyForm
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';
import { calculateReadTime } from '../utils/contentUtils';

/**
 * Form component for creating and editing dairy farming articles
 * 
 * @param {Object} props - Component props
 * @param {Function} props.refreshDairies - Callback to refresh dairy content list after submission
 * @param {Object|null} props.editingDairy - Dairy article object being edited, or null when creating new
 * @param {Function} props.setEditingDairy - Callback to reset the editing state
 * @returns {JSX.Element} Rendered form component
 */
const DairyForm = ({ refreshDairies, editingDairy, setEditingDairy }) => {
  // Form state management
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [autoReadTime, setAutoReadTime] = useState(1); // Auto-calculated read time
  
  // Image handling state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UI state
  const [error, setError] = useState('');
  const alert = useAlert();
  
  // Rich text editor references
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  /**
   * Auto-calculate read time when content changes
   */
  const updateReadTime = useCallback(() => {
    if (quillEditor) {
      const content = quillEditor.root.innerHTML;
      const readTime = calculateReadTime(content);
      setAutoReadTime(readTime);
    }
  }, [quillEditor]);

  /**
   * Update read time when content changes
   */
  useEffect(() => {
    if (quillEditor) {
      quillEditor.on('text-change', updateReadTime);
      // Calculate initial read time if editing
      updateReadTime();
      return () => {
        quillEditor.off('text-change', updateReadTime);
      };
    }
  }, [quillEditor, updateReadTime]);

  /**
   * Populate form fields when editing an existing dairy article
   * Handles both direct properties and nested metadata
   */
  useEffect(() => {
    if (editingDairy) {
      // Set basic article properties
      setTitle(editingDairy.title);
      setCategory(editingDairy.category || 'Dairy');
      setTags(editingDairy.tags ? editingDairy.tags.join(', ') : '');
      setPublished(editingDairy.published !== undefined ? editingDairy.published : true);
      setFeatured(editingDairy.featured || false);
      
      // Extract from metadata if it exists
      if (editingDairy.metadata) {
        setAuthor(editingDairy.metadata.author || '');
        setKeywords(editingDairy.metadata.keywords ? editingDairy.metadata.keywords.join(', ') : '');
        setSummary(editingDairy.metadata.summary || '');
      }
      
      // Set image preview using existing image URL
      setImagePreview(editingDairy.imageUrl);
      
      // Set rich text editor content
      if (quillEditor) {
        quillEditor.root.innerHTML = DOMPurify.sanitize(editingDairy.content || "");
      }
    }
  }, [editingDairy, quillEditor]);

  /**
   * Initialize the Quill rich text editor
   * Sets up the editor with appropriate configuration and toolbar options
   */
  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your dairy farming content here...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        },
      });
      setQuillEditor(editor);
    }
  }, [quillEditor]);

  /**
   * Setup and cleanup for the Quill editor
   * Initializes the editor when the component mounts and cleans up event listeners when unmounting
   */
  useEffect(() => {
    initializeQuill();
    return () => {
      if (quillEditor) {
        quillEditor.off('text-change');
      }
    };
  }, [initializeQuill, quillEditor]);

  /**
   * Handle image file selection for upload
   * Creates a preview of the selected image and stores the file for form submission
   * 
   * @param {Event} e - The file input change event
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  /**
   * Reset the form to its initial state
   * Clears all form fields, image preview, and editing state
   */
  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('Dairy');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    setFeatured(false);
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingDairy(null);
  };

  /**
   * Generate structured metadata from form fields
   * Creates a metadata object with SEO and content preview information
   * 
   * @returns {Object} Formatted metadata object with author, keywords, and summary
   */
  const generateMetadata = () => {
    const metadata = {};
    if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (summary.trim()) metadata.summary = summary.trim();
    if (author.trim()) metadata.author = author.trim();
    return metadata;
  };

  /**
   * Handle form submission with validation
   * Creates or updates dairy farming content through API calls
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    // Form validation
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    // Prepare data for submission
    const metadata = generateMetadata();
    const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // Build FormData object for submission (supports file uploads)
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(parsedTags));
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('published', published);
    formData.append('featured', featured);
    if (image) formData.append('image', image);

    try {
      setError('');
      
      // Handle updating existing dairy content
      if (editingDairy) {
        await axios.put(API_ENDPOINTS.UPDATE_DAIRY(editingDairy._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Dairy farming content updated successfully!');
      } 
      // Handle creating new dairy content
      else {
        await axios.post(API_ENDPOINTS.CREATE_DAIRY, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Dairy farming content created successfully!');
      }
      
      // Refresh list and reset form on success
      refreshDairies();
      resetForm();
    } catch (error) {
      // Handle and display submission errors
      console.error('Error saving dairy farming content:', error);
      setError(error.response?.data?.message || 'Failed to save dairy farming content');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6 transition-all duration-300 ease-in-out">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        {editingDairy ? 'Edit Dairy Farming Content' : 'Create Dairy Farming Content'}
      </h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            id="title"
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
        </div>
        
        {/* User-friendly metadata fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              id="author"
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
              <option value="Dairy">Dairy</option>
              <option value="Dairy Management">Dairy Management</option>
              <option value="Dairy Technology">Dairy Technology</option>
              <option value="Dairy Health">Dairy Health</option>
              <option value="Dairy Nutrition">Dairy Nutrition</option>
              <option value="Dairy Business">Dairy Business</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., dairy farming, milk production, cattle care</p>
          </div>
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
          <input
            id="keywords"
            type="text"
            placeholder="Enter SEO keywords separated by commas"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
          <p className="text-xs text-gray-500 mt-1">Keywords for search engine optimization</p>
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
          <textarea
            id="summary"
            placeholder="Enter a brief summary of the content"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
          <p className="text-xs text-gray-500 mt-1">Brief description for previews and search results</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Publish immediately
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured content
            </label>
          </div>
          
          {/* Auto-calculated read time display */}
          <div className="text-sm text-gray-500 italic">
            Estimated read time: {autoReadTime} minute{autoReadTime !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              id="file-input"
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-150 ease-in-out"
            >
              Choose Image
            </label>
            <span className="text-gray-600 text-sm">{image ? image.name : 'No file chosen'}</span>
          </div>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-4 max-w-xs rounded-md shadow-md" />
          )}
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <div ref={quillRef} id="content" className="h-72 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500" />
        </div>
      </div>
      
      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          {editingDairy ? 'Update Content' : 'Publish Content'}
        </button>
        {editingDairy && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default DairyForm;