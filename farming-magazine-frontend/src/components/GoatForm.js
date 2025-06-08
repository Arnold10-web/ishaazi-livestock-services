import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const GoatForm = ({ refreshGoats, editingGoat, setEditingGoat }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Goat');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [readTime, setReadTime] = useState(5);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingGoat) {
      setTitle(editingGoat.title);
      setCategory(editingGoat.category || 'Goat');
      setTags(editingGoat.tags ? editingGoat.tags.join(', ') : '');
      setPublished(editingGoat.published !== undefined ? editingGoat.published : true);
      setFeatured(editingGoat.featured || false);
      setReadTime(editingGoat.readTime || 5);
      
      // Extract from metadata if it exists
      if (editingGoat.metadata) {
        setAuthor(editingGoat.metadata.author || '');
        setKeywords(editingGoat.metadata.keywords ? editingGoat.metadata.keywords.join(', ') : '');
        setSummary(editingGoat.metadata.summary || '');
      }
      
      setImagePreview(editingGoat.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingGoat.content;
      }
    }
  }, [editingGoat, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your goat farming content here...',
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
    setCategory('Goat');
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
    setEditingGoat(null);
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

    const metadataObj = generateMetadata();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(metadataObj.tags));
    formData.append('keywords', JSON.stringify(metadataObj.keywords));
    formData.append('summary', summary);
    formData.append('published', published);
    formData.append('featured', featured);
    formData.append('readTime', readTime);
    formData.append('metadata', JSON.stringify(metadataObj));
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingGoat) {
        await axios.put(API_ENDPOINTS.UPDATE_GOAT(editingGoat._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Goat farming content updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_GOAT, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Goat farming content created successfully!');
      }
      refreshGoats();
      resetForm();
    } catch (error) {
      console.error('Error saving goat farming content:', error);
      setError(error.response?.data?.message || 'Failed to save goat farming content');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {editingGoat ? 'Edit Goat Farming Content' : 'Create Goat Farming Content'}
        </h2>
        {editingGoat && (
          <button
            type="button"
            onClick={resetForm}
            className="text-white hover:text-green-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-500 transition-all"
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
        
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter content title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            >
              <option value="Goat">Goat</option>
              <option value="Goat Management">Goat Management</option>
              <option value="Goat Health">Goat Health</option>
              <option value="Goat Nutrition">Goat Nutrition</option>
              <option value="Goat Breeding">Goat Breeding</option>
              <option value="Goat Business">Goat Business</option>
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., goat farming, management, health</p>
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out"
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
                  className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 bg-gray-50 dark:bg-gray-700 cursor-pointer group transition-all duration-200 ease-in-out"
                >
                  <div className="flex flex-col items-center space-y-1 text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {image ? image.name : 'Choose Image'}
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
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
          >
            {editingGoat ? 'Update Content' : 'Publish Content'}
          </button>
          {editingGoat && (
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

export default GoatForm;