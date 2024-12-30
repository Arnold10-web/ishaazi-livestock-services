import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import '../css/BasicForm.css';

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
      setMetadata(JSON.stringify(editingBasic.metadata));
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
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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

    // Validate required fields
    if (!title.trim() || !fileType || !description.trim()) {
      setError('Title, file type, and description are required.');
      return;
    }

    // Validate metadata JSON
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
        await axios.put(`${API_ENDPOINTS.UPDATE_BASIC(editingBasic._id)}`, formData, {
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
    <form onSubmit={handleSubmit} className="basic-form">
      <h3>{editingBasic ? 'Edit Basic Component' : 'Create Basic Component'}</h3>
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <select
        value={fileType}
        onChange={(e) => setFileType(e.target.value)}
        required
      >
        <option value="">Select File Type</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
      </select>
      <textarea
        placeholder="Metadata (JSON)"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
      />
      <input type="file" onChange={handleImageChange} accept="image/*" />
      <input type="file" onChange={handleMediaChange} accept="video/*,audio/*" />
      {imagePreview && (
        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
      )}
      <div ref={quillRef} className="quill-editor" style={{ height: '300px', marginBottom: '1rem' }}></div>
      <button type="submit">{editingBasic ? 'Update Component' : 'Create Component'}</button>
      {editingBasic && <button type="button" onClick={resetForm}>Cancel Edit</button>}
    </form>
  );
};

export default BasicForm;
