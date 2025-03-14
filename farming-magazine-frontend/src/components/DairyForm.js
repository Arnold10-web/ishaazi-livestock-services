import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const DairyForm = ({ refreshDairies, editingDairy, setEditingDairy }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingDairy) {
      setTitle(editingDairy.title);
      setMetadata(JSON.stringify(editingDairy.metadata));
      setImagePreview(editingDairy.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingDairy.content;
      }
    }
  }, [editingDairy, quillEditor]);

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
    setMetadata('{}');
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingDairy(null);
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
      if (editingDairy) {
        await axios.put(`${API_ENDPOINTS.UPDATE_DAIRY}/${editingDairy._id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Dairy farming content updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_DAIRY, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Dairy farming content created successfully!');
      }
      refreshDairies();
      resetForm();
    } catch (error) {
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
        
        <div>
          <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
          <textarea
            id="metadata"
            placeholder="Enter metadata in JSON format"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out h-24"
          />
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
          {editingDairy ? 'Update Dairy Farming Content' : 'Create Dairy Farming Content'}
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