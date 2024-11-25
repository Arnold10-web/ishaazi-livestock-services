import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';

const NewsForm = ({ refreshNews }) => {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('{}'); // JSON input
  const [image, setImage] = useState(null);
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  const token = localStorage.getItem('myAppAdminToken');



  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Unauthorized. Please login as admin.');
      return;
    }

    const content = quillEditor ? quillEditor.root.innerHTML : '';
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('metadata', metadata);
    if (image) formData.append('image', image);

    try {
      await axios.post(API_ENDPOINTS.CREATE_NEWS, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('News created successfully!');
      refreshNews();
      setTitle('');
      setMetadata('{}');
      setImage(null);
      if (quillEditor) quillEditor.setContents([]);
    } catch (error) {
      console.error('Error creating news:', error);
      alert('Failed to create news');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create News</h3>
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
      <button type="submit">Create News</button>
    </form>
  );
};

export default NewsForm;
