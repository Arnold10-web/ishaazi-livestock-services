import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const BeefForm = ({ refreshBeefs, editingBeef, setEditingBeef }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Beef');
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
    if (editingBeef) {
      setTitle(editingBeef.title);
      setCategory(editingBeef.category || 'Beef');
      setTags(editingBeef.tags ? editingBeef.tags.join(', ') : '');
      setPublished(editingBeef.published !== undefined ? editingBeef.published : true);
      setFeatured(editingBeef.featured || false);
      setReadTime(editingBeef.readTime || 5);
      
      // Extract from metadata if it exists
      if (editingBeef.metadata) {
        setAuthor(editingBeef.metadata.author || '');
        setKeywords(editingBeef.metadata.keywords ? editingBeef.metadata.keywords.join(', ') : '');
        setSummary(editingBeef.metadata.summary || '');
      }
      
      setImagePreview(editingBeef.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingBeef.content;
      }
    }
  }, [editingBeef, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your beef farming content here...',
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
    setCategory('Beef');
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
    setEditingBeef(null);
  };

  const generateMetadata = () => {
    return {
      author: author.trim(),
      category: category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      keywords: keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword),
      summary: summary.trim(),
      published: published,
      featured: featured,
      readTime: parseInt(readTime) || 5
    };
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
      if (editingBeef) {
        await axios.put(API_ENDPOINTS.UPDATE_BEEF(editingBeef._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Beef farming content updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BEEF, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Beef farming content created successfully!');
      }
      refreshBeefs();
      resetForm();
    } catch (error) {
      console.error('Error saving beef farming content:', error);
      setError(error.response?.data?.message || 'Failed to save beef farming content');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold">
        {editingBeef ? 'Edit Beef Farming Content' : 'Create Beef Farming Content'}
      </h3>
      {error && <div className="text-red-500">{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="Beef">Beef</option>
          <option value="Cattle Management">Cattle Management</option>
          <option value="Beef Health">Beef Health</option>
          <option value="Beef Nutrition">Beef Nutrition</option>
          <option value="Cattle Breeding">Cattle Breeding</option>
          <option value="Beef Business">Beef Business</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Keywords (comma-separated)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <textarea
        placeholder="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows="3"
        className="w-full p-2 border rounded"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="published" className="text-sm">Published</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="featured" className="text-sm">Featured</label>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="readTime" className="text-sm">Read Time (min):</label>
          <input
            type="number"
            id="readTime"
            value={readTime}
            onChange={(e) => setReadTime(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="60"
            className="w-16 p-1 border rounded"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          id="file-input"
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
          Choose Image
        </label>
        <span className="text-gray-600">{image ? image.name : 'No file chosen'}</span>
      </div>
      {imagePreview && (
        <img src={imagePreview} alt="Preview" className="max-w-xs mt-2" />
      )}
      <div ref={quillRef} className="h-72 border rounded" />
      <div className="flex space-x-2">
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          {editingBeef ? 'Update Beef Farming Content' : 'Create Beef Farming Content'}
        </button>
        {editingBeef && (
          <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default BeefForm;
