import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Quill.js styling
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth'; // Helper for Authorization header

const BlogForm = ({ refreshBlogs }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('{}'); // JSON input for metadata
  const [image, setImage] = useState(null);
  const quillRef = useRef(null); // Ref for the Quill editor
  const [quillEditor, setQuillEditor] = useState(null);

  // Initialize Quill editor
  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get content from the Quill editor
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('metadata', metadata);
    if (image) formData.append('image', image);

    try {
      await axios.post(API_ENDPOINTS.CREATE_BLOG, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Blog created successfully!');
      refreshBlogs();
      setTitle('');
      setMetadata('{}');
      setImage(null);
      if (quillEditor) quillEditor.setContents([]); // Clear Quill editor
    } catch (error) {
      console.error('Error creating blog:', error);
      alert(error.response?.data?.message || 'Failed to create blog');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Blog</h3>
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
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <div ref={quillRef} style={{ height: '300px', marginBottom: '1rem' }}></div>
      <button type="submit">Create Blog</button>
    </form>
  );
};

export default BlogForm;
