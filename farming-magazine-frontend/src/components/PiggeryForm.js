import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';

const PiggeryForm = ({ refreshPiggeries, editingPiggery, setEditingPiggery }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Piggery');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [readTime, setReadTime] = useState(5);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const alert = useAlert();
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingPiggery) {
      setTitle(editingPiggery.title);
      setCategory(editingPiggery.category || 'Piggery');
      setTags(editingPiggery.tags ? editingPiggery.tags.join(', ') : '');
      setPublished(editingPiggery.published !== undefined ? editingPiggery.published : true);
      setFeatured(editingPiggery.featured || false);
      setReadTime(editingPiggery.readTime || 5);
      
      // Extract from metadata if it exists
      if (editingPiggery.metadata) {
        setAuthor(editingPiggery.metadata.author || '');
        setKeywords(editingPiggery.metadata.keywords ? editingPiggery.metadata.keywords.join(', ') : '');
        setSummary(editingPiggery.metadata.summary || '');
      }
      
      setImagePreview(editingPiggery.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = DOMPurify.sanitize(editingPiggery.content || "");
      }
    }
  }, [editingPiggery, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your piggery content here...',
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

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('Piggery');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    setFeatured(false);
    setReadTime(5);
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingPiggery(null);
  };

  const generateMetadata = () => {
    const metadata = {};
    if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (summary.trim()) metadata.summary = summary.trim();
    if (author.trim()) metadata.author = author.trim();
    return metadata;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    const metadata = generateMetadata();
    const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(parsedTags));
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('published', published);
    formData.append('featured', featured);
    formData.append('readTime', readTime);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingPiggery) {
        await axios.put(API_ENDPOINTS.UPDATE_PIGGERY(editingPiggery._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Piggery updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_PIGGERY, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Piggery created successfully!');
      }
      refreshPiggeries();
      resetForm();
    } catch (error) {
      console.error('Error saving piggery:', error);
      setError(error.response?.data?.message || 'Failed to save piggery');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 py-4 px-6">
        <h3 className="text-2xl font-bold text-white">
          {editingPiggery ? 'Edit Piggery' : 'Create Piggery'}
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-required="true"
          />
        </div>

        {/* User-friendly metadata fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
            <input
              id="author"
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            >
              <option value="Piggery">Piggery</option>
              <option value="Pig Management">Pig Management</option>
              <option value="Pig Health">Pig Health</option>
              <option value="Pig Nutrition">Pig Nutrition</option>
              <option value="Pig Breeding">Pig Breeding</option>
              <option value="Pig Business">Pig Business</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., pig farming, management, health</p>
          </div>
          
          <div>
            <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Read Time (minutes)</label>
            <input
              id="readTime"
              type="number"
              min="1"
              max="60"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value) || 5)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            />
          </div>
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SEO Keywords</label>
          <input
            id="keywords"
            type="text"
            placeholder="Enter SEO keywords separated by commas"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keywords for search engine optimization</p>
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
          <textarea
            id="summary"
            placeholder="Enter a brief summary of the content"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Brief description for previews and search results</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Publish immediately
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Featured content
            </label>
          </div>
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
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200 cursor-pointer flex items-center dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <div
            className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500"
          >
            <div ref={quillRef} className="h-72 bg-white dark:bg-gray-700"></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {editingPiggery ? 'Update Content' : 'Publish Content'}
          </button>

          {editingPiggery && (
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

export default PiggeryForm;