import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const BasicForm = ({ refreshBasics, editingBasic, setEditingBasic }) => {
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [image, setImage] = useState(null);
  const [media, setMedia] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingBasic) {
      setTitle(editingBasic.title);
      setFileType(editingBasic.fileType);
      setMetadata(editingBasic.metadata ? JSON.stringify(editingBasic.metadata) : '{}');
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

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    setMedia(file);
  };

  const resetForm = () => {
    setTitle('');
    setFileType('');
    setMetadata('{}');
    setImage(null);
    setMedia(null);
    setImagePreview(null);
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

    try {
      JSON.parse(metadata);
    } catch (err) {
      setError('Invalid metadata JSON format.');
      return;
    }

    if (!media) {
      setError('Media file is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('fileType', fileType);
    formData.append('description', description);
    formData.append('metadata', metadata);
    if (image) formData.append('image', image);
    formData.append('media', media);

    try {
      setError('');
      if (editingBasic) {
        await axios.put(API_ENDPOINTS.UPDATE_BASIC(editingBasic._id), formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Basic component updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BASIC, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Basic component created successfully!');
      }
      refreshBasics();
      resetForm();
    } catch (error) {
      console.error('Error saving basic component:', error);
      setError(error.response?.data?.message || 'Failed to save basic component');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold">
        {editingBasic ? 'Edit Basic Component' : 'Create Basic Component'}
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
      <select
        value={fileType}
        onChange={(e) => setFileType(e.target.value)}
        required
        className="w-full p-2 border rounded"
      >
        <option value="">Select File Type</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
      </select>
      <textarea
        placeholder="Metadata (JSON)"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <div className="space-y-2">
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          onChange={handleMediaChange}
          accept="video/*,audio/*"
          className="w-full p-2 border rounded"
        />
      </div>
      {imagePreview && (
        <img src={imagePreview} alt="Preview" className="max-w-xs mt-2" />
      )}
      <div ref={quillRef} className="h-72 border rounded" />
      <div className="flex space-x-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingBasic ? 'Update Component' : 'Create Component'}
        </button>
        {editingBasic && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default BasicForm;
