import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import '../css/NewsForm.css';
const NewsForm = ({ refreshNews, editingNews, setEditingNews }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingNews) {
      setTitle(editingNews.title);
      setMetadata(JSON.stringify(editingNews.metadata));
      setImagePreview(editingNews.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingNews.content;
      }
    }
  }, [editingNews, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your news content here...',
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
    setMetadata('{}');
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingNews(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    // Validate required fields
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    // Validate metadata JSON
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
      if (editingNews) {
        await axios.put(`${API_ENDPOINTS.UPDATE_NEWS}/${editingNews._id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('News updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_NEWS, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('News created successfully!');
      }
      refreshNews();
      resetForm();
    } catch (error) {
      console.error('Error saving news:', error);
      setError(error.response?.data?.message || 'Failed to save news');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="news-form">
      <h3>{editingNews ? 'Edit News' : 'Create News'}</h3>
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Metadata (JSON)"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
      />
      <input type="file" onChange={handleImageChange} />
      {imagePreview && (
        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
      )}
       <div ref={quillRef} className="quill-editor" style={{ height: '300px' }}></div>
      <button type="submit">{editingNews ? 'Update News' : 'Create News'}</button>
      {editingNews && <button type="button" onClick={resetForm}>Cancel Edit</button>}
    </form>
  );
};

export default NewsForm;