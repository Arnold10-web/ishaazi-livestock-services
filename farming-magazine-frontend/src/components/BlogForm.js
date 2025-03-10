import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
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
      setMetadata(editingBlog.metadata ? JSON.stringify(editingBlog.metadata) : '{}');
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
          toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']],
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
      if (editingBlog) {
        await axios.put(API_ENDPOINTS.UPDATE_BLOG(editingBlog._id), formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
        });
        alert('Blog updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_BLOG, formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">{editingBlog ? 'Edit Blog' : 'Create Blog'}</h3>
      {error && <div className="text-red-500 mb-3">{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-2 border rounded mb-3"
      />
      <textarea
        placeholder="Metadata (JSON)"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      />
      <div className="mb-3">
        <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" id="file-input" />
        <label htmlFor="file-input" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">Choose Image</label>
        <span className="ml-2">{image ? image.name : 'No file chosen'}</span>
      </div>
      {imagePreview && <img src={imagePreview} alt="Preview" className="max-w-xs mt-2" />}
      <div ref={quillRef} className="h-72 border rounded mb-3"></div>
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
        {editingBlog ? 'Update Blog' : 'Create Blog'}
      </button>
      {editingBlog && (
        <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel Edit
        </button>
      )}
    </form>
  );
};

export default BlogForm;
