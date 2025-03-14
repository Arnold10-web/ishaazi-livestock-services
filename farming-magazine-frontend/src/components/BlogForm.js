import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const BlogForm = ({ refreshBlogs, editingBlog, setEditingBlog }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingBlog) {
      setTitle(editingBlog.title);
      setMetadata(editingBlog.metadata ? JSON.stringify(editingBlog.metadata) : '{}');
      setImagePreview(editingBlog.imageUrl);
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
    setMetadata('{}');
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

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      JSON.parse(metadata);
    } catch (err) {
      setError('Invalid metadata JSON format.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('metadata', metadata);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingBlog) {
        await axios.put(API_ENDPOINTS.UPDATE_BLOG(editingBlog._id), formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
        });
        alert('Blog updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BLOG, formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
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
        
        <div className="space-y-2">
          <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Blog Title
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
          <label htmlFor="blog-metadata" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Metadata (JSON)
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Optional</span>
          </label>
          <textarea
            id="blog-metadata"
            placeholder='{"tags": ["example", "blog"], "category": "tech"}'
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out font-mono text-sm"
            rows="3"
          />
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