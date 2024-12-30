import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../css/BlogForm.css';
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
      setMetadata(JSON.stringify(editingBlog.metadata));
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
    setEditingBlog(null);
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
      if (editingBlog) {
        await axios.put(`${API_ENDPOINTS.UPDATE_BLOG}/${editingBlog._id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Blog updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BLOG, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
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
    <form onSubmit={handleSubmit} className="blog-form">
      <h3>{editingBlog ? 'Edit Blog' : 'Create Blog'}</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
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
<div className="file-input-wrapper">
  <input
    type="file"
    onChange={handleImageChange}
    accept="image/*"
    id="file-input"
    style={{ display: 'none' }}
  />
  <label htmlFor="file-input" className="file-input-button">
    Choose Image
  </label>
  <span className="file-name">{image ? image.name : 'No file chosen'}</span>
</div>
      {imagePreview && (
        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
      )}
     <div ref={quillRef} className="blog-form-quill" style={{ height: '300px', marginBottom: '1rem' }}></div>
      <button type="submit">{editingBlog ? 'Update Blog' : 'Create Blog'}</button>
      {editingBlog && <button type="button" onClick={resetForm}>Cancel Edit</button>}
    </form>
  );
};

export default BlogForm;