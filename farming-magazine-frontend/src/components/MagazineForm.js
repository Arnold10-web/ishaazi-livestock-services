import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';
import useAutoSave from '../hooks/useAutoSave';

const MagazineForm = ({ refreshMagazines, editingMagazine, setEditingMagazine }) => {
  const [title, setTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [price, setPrice] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');  // Changed from 'Agriculture' to 'General' to match backend validation
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const alert = useAlert();
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  // Auto-save form data
  const formData = {
    title,
    issue,
    price,
    author,
    category,
    tags,
    keywords,
    summary,
    published,
    featured,
    content: quillEditor ? quillEditor.root.innerHTML : ''
  };

  const storageKey = `magazine_form_${editingMagazine?._id || 'new'}`;
  
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
    onSaveSuccess: () => console.log('Magazine auto-saved to localStorage'),
    onSaveError: (error) => console.error('Magazine auto-save failed:', error)
  });

  useEffect(() => {
    if (editingMagazine) {
      setTitle(editingMagazine.title);
      setIssue(editingMagazine.issue);
      setPrice(editingMagazine.price.toString());
      setCategory(editingMagazine.category || 'General');  // Changed from 'Agriculture' to 'General' to match backend validation
      setTags(editingMagazine.tags ? editingMagazine.tags.join(', ') : '');
      setPublished(editingMagazine.published !== undefined ? editingMagazine.published : true);
      setFeatured(editingMagazine.featured || false);
      
      // Extract from metadata if it exists
      if (editingMagazine.metadata) {
        setAuthor(editingMagazine.metadata.author || '');
        setKeywords(editingMagazine.metadata.keywords ? editingMagazine.metadata.keywords.join(', ') : '');
        setSummary(editingMagazine.metadata.summary || '');
      }
      
      setImagePreview(editingMagazine.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingMagazine.description;
      }
    }
  }, [editingMagazine, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your magazine description here...',
        modules: { 
          toolbar: [
            ['bold', 'italic', 'underline'], 
            [{ list: 'ordered' }, { list: 'bullet' }], 
            ['link', 'image'], 
            ['clean']
          ] 
        }
      });
      setQuillEditor(editor);
      
      // Initialize with some content to make debugging easier
      if (!editingMagazine) {
        editor.root.innerHTML = '<p>Enter your magazine description here. This is a required field.</p>';
      }
    }
  }, [quillEditor, editingMagazine]);

  useEffect(() => {
    initializeQuill();
    return () => { if (quillEditor) quillEditor.off('text-change'); };
  }, [initializeQuill, quillEditor]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    // Validate file type
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        setError(`Invalid image format. Please select a JPEG, PNG, GIF, or WEBP file.`);
        e.target.value = '';
        return;
      }
      
      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 5MB.`);
        e.target.value = '';
        return;
      }
      
      console.log(`Image selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      setImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setIssue('');
    setPrice('');
    setAuthor('');
    setCategory('General');  // Changed from 'Agriculture' to 'General' to match backend validation
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    setFeatured(false);
    setImage(null);
    setPdf(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingMagazine(null);
  };

  // Function removed to eliminate ESLint warnings

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Get description from Quill editor
    const description = quillEditor ? quillEditor.root.innerHTML : '';
    
    // Basic validation
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    
    if (!issue.trim()) {
      setError('Issue number/name is required.');
      return;
    }
    
    if (!description || description === '<p><br></p>') {
      setError('Description is required.');
      return;
    }
    
    // Check if files are present for new magazine creation
    if (!editingMagazine && (!image || !pdf)) {
      setError('Both cover image and PDF file are required for new magazines.');
      return;
    }
    
    try {
      // Show loading indicator
      setError('Processing submission...');
      
      // Create a fresh FormData object with only the essential fields
      const formData = new FormData();
      
      // Start with required fields
      formData.append('title', title.trim());
      formData.append('description', description);
      formData.append('issue', issue.trim());
      
      // Add files which are also required
      if (image) {
        formData.append('image', image);
      }
      
      if (pdf) {
        formData.append('pdf', pdf);
      }
      
      // Add other fields
      if (price) formData.append('price', price);
      if (author) formData.append('author', author);
      formData.append('category', category); // Always include category
      
      // Process tags
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      formData.append('tags', JSON.stringify(tagsArray)); // Always send a JSON array even if empty
      
      // Add boolean fields as strings
      formData.append('published', String(published));
      formData.append('featured', String(featured));
      
      // Create and add metadata
      const metadataObj = {};
      
      if (keywords) {
        metadataObj.keywords = keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
      }
      
      if (summary) {
        metadataObj.summary = summary;
      }
      
      // Always stringify metadata even if empty to ensure proper format
      formData.append('metadata', JSON.stringify(metadataObj));
      
      // Debug logging
      console.log('Submitting magazine with the following fields:', 
        [...formData.entries()].map(entry => {
          if (entry[1] instanceof File) {
            return `${entry[0]}: File (${entry[1].name}, ${entry[1].type}, ${entry[1].size} bytes)`;
          }
          return `${entry[0]}: ${entry[1]}`;
        })
      );
      
      // Submit the form
      if (editingMagazine) {
        const response = await axios.put(API_ENDPOINTS.UPDATE_MAGAZINE(editingMagazine._id), formData, { 
          headers: { 
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Magazine updated successfully:', response.data);
      } else {
        console.log('Submitting magazine creation with data:', {
          title,
          issue,
          description: 'HTML content',
          price,
          category,
          tags: tagsArray,
          hasImage: !!image ? `${image.name} (${image.size} bytes)` : false,
          hasPdf: !!pdf ? `${pdf.name} (${pdf.size} bytes)` : false
        });
        
        const response = await axios.post(API_ENDPOINTS.CREATE_MAGAZINE, formData, { 
          headers: { 
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Magazine created successfully:', response.data);
      }
      
      // Reset form and show success message
      refreshMagazines();
      resetForm();
      setError('');
      alert.success(editingMagazine ? 'Magazine updated successfully!' : 'Magazine created successfully!');
    } catch (error) {
      console.error('Magazine submission error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to save magazine';
      setError(`Error: ${errorMessage}. Please check all required fields and try again.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">{editingMagazine ? 'Edit Magazine' : 'Create Magazine'}</h3>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Title (Required)</label>
        <input type="text" placeholder="Magazine Title" value={title} onChange={(e) => setTitle(e.target.value)} required className={`w-full p-2 border rounded ${!title && 'border-red-500'}`} />
        {!title && <p className="text-red-500 text-xs mt-1">Title is required</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Number (Required)</label>
          <input type="text" placeholder="June 2025" value={issue} onChange={(e) => setIssue(e.target.value)} required className={`w-full p-2 border rounded ${!issue && 'border-red-500'}`} />
          {!issue && <p className="text-red-500 text-xs mt-1">Issue is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full p-2 border rounded" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded">
          <option value="General">General</option>
          <option value="Livestock">Livestock</option>
          <option value="Crops">Crops</option>
          <option value="Technology">Technology</option>
          <option value="Sustainability">Sustainability</option>
          <option value="Business">Business</option>
          <option value="Market">Market</option>
          <option value="Equipment">Equipment</option>
          <option value="Nutrition">Nutrition</option>
          <option value="Research">Research</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Keywords (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <textarea placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows="3" className="w-full p-2 border rounded" />

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="published" className="text-sm">Published</label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="featured" className="text-sm">Featured content</label>
        </div>
      </div>
      <div ref={quillRef} className="h-40 bg-gray-100 border p-2 rounded"></div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image {!editingMagazine && <span className="text-red-500">*</span>}</label>
        <div className="flex items-center space-x-2">
          <input 
            type="file" 
            onChange={handleImageChange} 
            accept="image/jpeg,image/png,image/gif,image/webp" 
            className={`w-full p-2 border rounded ${!image && !editingMagazine ? 'border-red-500' : ''}`} 
            id="magazine-image"
          />
          {!editingMagazine && (
            <button 
              type="button" 
              onClick={() => document.getElementById('magazine-image').click()}
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            >
              Browse...
            </button>
          )}
        </div>
        {!image && !editingMagazine && <p className="text-red-500 text-xs mt-1">Cover image is required</p>}
        {imagePreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Image Preview:</p>
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover border rounded" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PDF File (Required)</label>
        <div className="flex items-center space-x-2">
          <input 
            type="file" 
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                // Validate file type
                if (file.type !== 'application/pdf') {
                  setError(`Invalid file format. Please select a PDF file.`);
                  e.target.value = '';
                  return;
                }
                
                // Validate file size (limit to 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  setError(`PDF is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
                  e.target.value = '';
                  return;
                }
                
                console.log(`PDF selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
                setPdf(file);
              } else {
                setPdf(null);
              }
            }} 
            accept="application/pdf,.pdf" 
            className={`w-full p-2 border rounded ${!pdf && !editingMagazine ? 'border-red-500' : ''}`}
            id="magazine-pdf"
          />
          <button 
            type="button" 
            onClick={() => document.getElementById('magazine-pdf').click()}
            className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
          >
            Browse...
          </button>
        </div>
        {!pdf && !editingMagazine && <p className="text-red-500 text-xs mt-1">PDF file is required</p>}
        {pdf && <p className="text-green-600 text-xs mt-1">File selected: {pdf.name} ({(pdf.size / 1024).toFixed(2)} KB)</p>}
      </div>
      
      {/* Auto-save status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
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
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={manualSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>
          )}
          
          <button
            type="button"
            onClick={clearSaved}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center text-sm dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Draft
          </button>

          <button type="submit" className="flex-1 sm:flex-none bg-blue-600 text-white p-2 px-6 rounded hover:bg-blue-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {editingMagazine ? 'Update Magazine' : 'Publish Magazine'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default MagazineForm;
