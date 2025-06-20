import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const BlogForm = ({ refreshBlogs, editingBlog, setEditingBlog }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  // Helper function to convert simple inputs to metadata JSON
  const generateMetadata = () => {
    const metadata = {};
    if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (summary.trim()) metadata.summary = summary.trim();
    // Author is now handled as a top-level field, not in metadata
    return metadata;
  };

  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title || '');
      setCategory(editingBlog.category || 'General');
      setTags(editingBlog.tags ? editingBlog.tags.join(', ') : '');
      setPublished(editingBlog.published || false);
      setImagePreview(editingBlog.imageUrl);
      
      // Set author from top-level property or from metadata as fallback
      setAuthor(editingBlog.author || (editingBlog.metadata?.author || ''));
      
      // Extract metadata fields
      if (editingBlog.metadata) {
        setKeywords(editingBlog.metadata.keywords ? editingBlog.metadata.keywords.join(', ') : '');
        setSummary(editingBlog.metadata.summary || '');
      }
      
      if (quillEditor) {
        quillEditor.root.innerHTML = editingBlog.content;
      }
    }
  }, [editingBlog, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your blog content here...',
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
    setAuthor('');
    setCategory('General');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(false);
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingBlog(null);
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
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('author', author); // Add author as a top-level field
    
    // Just append tags as a comma-separated string, which is simpler for the server to parse
    formData.append('tags', tagsArray.join(','));
    
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('published', published.toString()); // Convert boolean to string explicitly
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingBlog) {
        // Remove Content-Type header - let axios set it automatically for FormData
        await axios.put(API_ENDPOINTS.UPDATE_BLOG(editingBlog._id), formData, {
          headers: { ...getAuthHeader() },
        });
        alert('Blog updated successfully!');
      } else {
        // Remove Content-Type header - let axios set it automatically for FormData
        await axios.post(API_ENDPOINTS.CREATE_BLOG, formData, {
          headers: { ...getAuthHeader() },
        });
        alert('Blog created successfully!');
      }
      refreshBlogs();
      resetForm();
    } catch (error) {
      console.error('Error saving blog:', error);
      setError(error.response?.data?.message || 'Failed to save blog');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6">
        <h3 className="text-2xl font-bold text-white">
          {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md dark:bg-red-900/30 dark:border-red-400" role="alert">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Title <span className="text-red-500">*</span>
            </label>
            <input
              id="blog-title"
              type="text"
              placeholder="Enter blog title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
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
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            >
              <option value="General">General</option>
              <option value="Technology">Technology</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Livestock">Livestock</option>
              <option value="News">News</option>
            </select>
          </div>

          <div className="space-y-2 flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Publish immediately
              </span>
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
            placeholder="technology, farming, tips (separate with commas)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-describedby="tags-help"
          />
          <p id="tags-help" className="text-xs text-gray-500 dark:text-gray-400">
            Enter tags separated by commas (e.g., farming, technology, tips)
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
              placeholder="blog tips, technology, farming"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Summary
            </label>
            <textarea
              id="summary"
              placeholder="Brief summary for SEO and previews"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
              rows="3"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="blog-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Featured Image
          </label>
          <div className="flex items-center space-x-2">
            <input 
              type="file" 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
              id="blog-image"
            />
            <label 
              htmlFor="blog-image" 
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
          <label htmlFor="blog-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Blog Content
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
            {editingBlog ? 'Update Blog' : 'Publish Blog'}
          </button>
          
          {editingBlog && (
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

export default BlogForm;