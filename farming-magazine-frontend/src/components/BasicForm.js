import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';
import { calculateMediaDuration, formatDuration } from '../utils/contentUtils';

const BasicForm = ({ refreshBasics, editingBasic, setEditingBasic }) => {
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState(null);
  const [media, setMedia] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [calculatedDuration, setCalculatedDuration] = useState(0); // Auto-calculated duration
  const [error, setError] = useState('');
  const alert = useAlert();
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingBasic) {
      setTitle(editingBasic.title);
      setFileType(editingBasic.fileType);
      setCategory(editingBasic.category || 'General');
      setTags(editingBasic.tags ? editingBasic.tags.join(', ') : '');
      setPublished(editingBasic.published !== undefined ? editingBasic.published : true);
      
      // Extract from metadata if it exists
      if (editingBasic.metadata) {
        setAuthor(editingBasic.metadata.author || '');
        setKeywords(editingBasic.metadata.keywords ? editingBasic.metadata.keywords.join(', ') : '');
        setSummary(editingBasic.metadata.summary || '');
      }
      
      setImagePreview(editingBasic.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingBasic.description;
      }
    }
  }, [editingBasic, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your description here...',
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

  const handleMediaChange = async (e) => {
    const file = e.target.files[0];
    setMedia(file);
    
    if (file) {
      // Auto-calculate duration for media files
      try {
        const duration = await calculateMediaDuration(file);
        setCalculatedDuration(duration);
      } catch (error) {
        console.error('Error calculating media duration:', error);
        setCalculatedDuration(0);
      }
    } else {
      setCalculatedDuration(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFileType('');
    setAuthor('');
    setCategory('General');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    setImage(null);
    setMedia(null);
    setImagePreview(null);
    setCalculatedDuration(0);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingBasic(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title.trim() || !fileType || !description.trim()) {
      setError('Title, file type, and description are required.');
      return;
    }

    if (!media && !editingBasic) {
      setError('Media file is required for new basic components.');
      return;
    }

    // Create metadata object with all the additional fields
    const metadataObj = {
      author: author.trim(),
      category: category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      keywords: keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword),
      summary: summary.trim(),
      duration: calculatedDuration
    };

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('fileType', fileType);
    formData.append('duration', String(calculatedDuration));
    formData.append('published', String(published));
    formData.append('metadata', JSON.stringify(metadataObj));
    if (image) formData.append('image', image);
    if (media) formData.append('media', media);

    try {
      setError('');
      if (editingBasic) {
        await axios.put(API_ENDPOINTS.UPDATE_BASIC(editingBasic._id), formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Basic component updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BASIC, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Basic component created successfully!');
      }
      refreshBasics();
      resetForm();
    } catch (error) {
      console.error('Error saving basic component:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to save basic component';
      
      if (error.response?.status === 413 || error.message?.includes('413')) {
        errorMessage = 'File too large. Video files must be under 100MB and images under 10MB.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid file format or data.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('File too large')) {
        errorMessage = 'File too large. Video files must be under 100MB and images under 10MB.';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
        <h3 className="text-2xl font-bold text-white">
          {editingBasic ? 'Edit Basic Component' : 'Create Basic Component'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md dark:bg-red-900/30 dark:border-red-400" role="alert">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            File Type
          </label>
          <select
            id="fileType"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
          >
            <option value="">Select File Type</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Author
            </label>
            <input
              id="author"
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            >
              <option value="General">General</option>
              <option value="Education">Education</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Documentary">Documentary</option>
              <option value="Interview">Interview</option>
              <option value="Podcast">Podcast</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Keywords
            </label>
            <input
              id="keywords"
              type="text"
              placeholder="Enter keywords (comma-separated)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
        </div>

        <div className="space-y-2 flex items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Summary
          </label>
          <textarea
            id="summary"
            placeholder="Enter a brief summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            rows="3"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
              id="image"
            />
            <label
              htmlFor="image"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200 cursor-pointer flex items-center dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
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
          <label htmlFor="media" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Media File
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={handleMediaChange}
              accept="video/*,audio/*"
              className="hidden"
              id="media"
            />
            <label
              htmlFor="media"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200 cursor-pointer flex items-center dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Choose Media
            </label>
            {media && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {media.name}
                {calculatedDuration > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    Duration: {formatDuration(calculatedDuration)}
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported formats: MP4, AVI, MOV, WMV (video) | MP3, WAV (audio). Max size: 100MB
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <div
            className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          >
            <div ref={quillRef} className="h-72 bg-white dark:bg-gray-700"></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {editingBasic ? 'Update Content' : 'Publish Content'}
          </button>

          {editingBasic && (
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

export default BasicForm;