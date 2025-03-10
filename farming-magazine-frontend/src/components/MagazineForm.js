import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const MagazineForm = ({ refreshMagazines, editingMagazine, setEditingMagazine }) => {
  const [title, setTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingMagazine) {
      setTitle(editingMagazine.title);
      setIssue(editingMagazine.issue);
      setPrice(editingMagazine.price.toString());
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
        modules: { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']] }
      });
      setQuillEditor(editor);
    }
  }, [quillEditor]);

  useEffect(() => {
    initializeQuill();
    return () => { if (quillEditor) quillEditor.off('text-change'); };
  }, [initializeQuill, quillEditor]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';
    if (!title.trim() || !issue.trim() || !description.trim()) {
      setError('Title, issue, and description are required.');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('issue', issue);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('image', image);
    formData.append('pdf', pdf);
    try {
      setError('');
      if (editingMagazine) {
        await axios.put(API_ENDPOINTS.UPDATE_MAGAZINE(editingMagazine._id), formData, { headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(API_ENDPOINTS.CREATE_MAGAZINE, formData, { headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' } });
      }
      refreshMagazines();
      setEditingMagazine(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save magazine');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">{editingMagazine ? 'Edit Magazine' : 'Create Magazine'}</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="text" placeholder="Issue" value={issue} onChange={(e) => setIssue(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-2 border rounded" />
      <div ref={quillRef} className="h-40 bg-gray-100 border p-2 rounded"></div>
      <input type="file" onChange={handleImageChange} accept="image/*" className="w-full p-2 border rounded" />
      {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover mt-2" />}
      <input type="file" onChange={(e) => setPdf(e.target.files[0])} accept=".pdf" className="w-full p-2 border rounded" />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">{editingMagazine ? 'Update Magazine' : 'Create Magazine'}</button>
    </form>
  );
};

export default MagazineForm;
