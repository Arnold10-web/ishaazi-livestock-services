/**
 * NewsForm Component
 * 
 * Form component for creating and editing farming news articles.
 * Features rich text editing with Quill, image upload functionality,
 * breaking news designation, and location-based metadata.
 * 
 * @module components/NewsForm
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';
import useAutoSave from '../hooks/useAutoSave';

/**
 * Form component for creating and editing farming news articles
 * 
 * @param {Object} props - Component props
 * @param {Function} props.refreshNews - Callback to refresh news list after submission
 * @param {Object|null} props.editingNews - News article object being edited, or null when creating new
 * @param {Function} props.setEditingNews - Callback to reset the editing state
 * @returns {JSX.Element} Rendered form component
 */
const NewsForm = ({ refreshNews, editingNews, setEditingNews }) => {
  // Form state management
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');  // Changed from 'News' to 'General' to match backend validation
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  
  // Image handling state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // News-specific state
  const [isBreaking, setIsBreaking] = useState(false);
  
  // UI state
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const alert = useAlert();
  
  // Rich text editor references
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  // Auto-save form data
  const formData = {
    title,
    author,
    category,
    tags,
    keywords,
    summary,
    location,
    content,
    published,
    featured,
    isBreaking
  };

  const storageKey = editingNews ? `news-draft-${editingNews._id}` : 'news-draft-new';
  
  const {
    loadSavedData,
    clearSavedData
  } = useAutoSave(formData, storageKey, null, {
    autoSaveInterval: 30000, // Save every 30 seconds
    debounceDelay: 2000, // Wait 2 seconds after typing stops
    onSaveSuccess: (saveType) => {
      console.log(`✅ News auto-saved to ${saveType}`);
    },
    onSaveError: (error, saveType) => {
      console.error(`❌ Failed to auto-save news to ${saveType}:`, error);
    }
  });

  /**
   * Generate structured metadata from form fields
   * Creates a metadata object with SEO, location, and content preview information
   * 
   * @returns {Object} Formatted metadata object with keywords, summary and location
   */
  const generateMetadata = () => {
    const metadata = {};
    if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (summary.trim()) metadata.summary = summary.trim();
    if (location.trim()) metadata.location = location.trim();
    return metadata;
  };

  useEffect(() => {
    if (editingNews) {
      setTitle(editingNews.title || '');
      setAuthor(editingNews.author || '');
      setCategory(editingNews.category || 'general');
      setTags(editingNews.tags ? editingNews.tags.join(', ') : '');
      setPublished(editingNews.published || false);
      setFeatured(editingNews.featured || false);
      setIsBreaking(editingNews.isBreaking || false);
      setImagePreview(editingNews.imageUrl);
      
      // Extract metadata fields
      if (editingNews.metadata) {
        setKeywords(editingNews.metadata.keywords ? editingNews.metadata.keywords.join(', ') : '');
        setSummary(editingNews.metadata.summary || '');
        setLocation(editingNews.metadata.location || '');
      }
      
      const newsContent = editingNews.content || '';
      setContent(newsContent);
      
      if (quillEditor) {
        quillEditor.root.innerHTML = newsContent;
      }
    } else {
      // Try to load draft when creating new news
      const savedDraft = loadSavedData();
      if (savedDraft && !editingNews) {
        const shouldRestore = window.confirm(
          `Found a saved draft from ${new Date(savedDraft.lastSaved).toLocaleString()}. Do you want to restore it?`
        );
        
        if (shouldRestore) {
          setTitle(savedDraft.title || '');
          setAuthor(savedDraft.author || '');
          setCategory(savedDraft.category || 'general');
          setTags(savedDraft.tags || '');
          setKeywords(savedDraft.keywords || '');
          setSummary(savedDraft.summary || '');
          setLocation(savedDraft.location || '');
          setPublished(savedDraft.published || false);
          setFeatured(savedDraft.featured || false);
          setIsBreaking(savedDraft.isBreaking || false);
          
          const draftContent = savedDraft.content || '';
          setContent(draftContent);
          
          if (quillEditor) {
            quillEditor.root.innerHTML = draftContent;
          }
        } else {
          clearSavedData();
        }
      }
    }
  }, [editingNews, quillEditor, loadSavedData, clearSavedData]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your news content here...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        },
      });
      
      // Track content changes for auto-save
      editor.on('text-change', () => {
        setContent(editor.root.innerHTML);
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
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('General');  // Changed from 'News' to 'General' to match backend validation
    setTags('');
    setKeywords('');
    setSummary('');
    setLocation('');
    setContent('');
    setPublished(false);
    setFeatured(false);
    setIsBreaking(false);
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingNews(null);
    clearSavedData(); // Clear auto-saved draft
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title.trim() || !content.trim() || !author.trim()) {
      setError('Title, content, and author are required.');
      return;
    }

    // Generate metadata from user-friendly inputs
    const metadata = generateMetadata();
    
    // Convert tags from comma-separated string to array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('published', published);
    formData.append('featured', featured);
    formData.append('isBreaking', isBreaking);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingNews) {
        await axios.put(API_ENDPOINTS.UPDATE_NEWS(editingNews._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('News updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_NEWS, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('News created successfully!');
      }
      refreshNews();
      clearSavedData(); // Clear auto-saved draft on successful submission
      resetForm();
    } catch (error) {
      console.error('Error saving news:', error);
      setError(error.response?.data?.message || 'Failed to save news');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {editingNews ? 'Edit News Article' : 'Create News Article'}
        </h2>
        {editingNews && (
          <button
            type="button"
            onClick={resetForm}
            className="text-white hover:text-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 transition-all"
            aria-label="Cancel editing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter news title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              id="author"
              type="text"
              placeholder="Author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            >
              <option value="General">General</option>
              <option value="Breaking">Breaking</option>
              <option value="Market">Market</option>
              <option value="Weather">Weather</option>
              <option value="Policy">Policy</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="published" className="flex items-center space-x-2">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publish immediately</span>
            </label>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center">
            <label htmlFor="featured" className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured content</span>
            </label>
          </div>

          {/* Breaking News Toggle */}
          <div className="flex items-center">
            <label htmlFor="isBreaking" className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBreaking"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Breaking News</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            placeholder="farming, agriculture, livestock (separate with commas)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            aria-describedby="tags-help"
          />
          <p id="tags-help" className="text-xs text-gray-500 dark:text-gray-400">
            Enter tags separated by commas (e.g., farming, agriculture, livestock)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Keywords (for SEO)
            </label>
            <input
              id="keywords"
              type="text"
              placeholder="farming tips, organic, sustainable"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
              aria-describedby="keywords-help"
            />
            <p id="keywords-help" className="text-xs text-gray-500 dark:text-gray-400">
              Keywords help with search engine optimization
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g., Kampala, Uganda"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Summary (Brief description)
          </label>
          <textarea
            id="summary"
            placeholder="Brief summary of the article..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out resize-none"
            aria-describedby="summary-help"
          />
          <p id="summary-help" className="text-xs text-gray-500 dark:text-gray-400">
            A brief summary that will be used for previews and search results
          </p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Featured Image
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700 cursor-pointer group transition-all duration-200 ease-in-out"
                >
                  <div className="flex flex-col items-center space-y-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {image ? 'Change image' : 'Upload image'}
                    </span>
                  </div>
                </label>
              </div>
            </div>
            {imagePreview && (
              <div className="flex-1 sm:max-w-xs">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="content-editor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content <span className="text-red-500">*</span>
          </label>
          <div id="content-editor" className="h-72 border rounded-lg">
            <div ref={quillRef} className="h-full" />
          </div>
        </div>
        
        <div className="pt-6 flex flex-col sm:flex-row gap-3 items-center">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
          >
            {editingNews ? 'Update Article' : 'Publish Article'}
          </button>
          {editingNews && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewsForm;