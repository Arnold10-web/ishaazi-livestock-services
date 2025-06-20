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
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Agriculture');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
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
      setCategory(editingMagazine.category || 'Agriculture');
      setTags(editingMagazine.tags ? editingMagazine.tags.join(', ') : '');
      setPublished(editingMagazine.published !== undefined ? editingMagazine.published : true);
      setFeatured(editingMagazine.featured || false);
      
      // Extract from metadata if it exists
      if (editingMagazine.metadata) {
        setAuthor(editingMagazine.metadata.author || '');
        setKeywords(editingMagazine.metadata.keywords ? editingMagazine.metadata.keywords.join(', ') : '');
        setSummary(editingMagazine.metadata.summary || '');
      }
      
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

  const resetForm = () => {
    setTitle('');
    setIssue('');
    setPrice('');
    setAuthor('');
    setCategory('Agriculture');
    setTags('');
    setKeywords('');
    setSummary('');
    setPublished(true);
    setFeatured(false);
    setImage(null);
    setPdf(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingMagazine(null);
  };

  const generateMetadata = () => {
    return {
      author: author.trim(),
      category: category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      keywords: keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword),
      summary: summary.trim(),
      published: published,
      featured: featured
    };
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
    formData.append('author', author);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(generateMetadata().tags));
    formData.append('keywords', JSON.stringify(generateMetadata().keywords));
    formData.append('summary', summary);
    formData.append('published', published);
    formData.append('featured', featured);
    formData.append('metadata', JSON.stringify(generateMetadata()));
    formData.append('image', image);
    formData.append('pdf', pdf);
    try {
      setError('');
      if (editingMagazine) {
        await axios.put(API_ENDPOINTS.UPDATE_MAGAZINE(editingMagazine._id), formData, { headers: { ...getAuthHeader() } });
      } else {
        await axios.post(API_ENDPOINTS.CREATE_MAGAZINE, formData, { headers: { ...getAuthHeader() } });
      }
      refreshMagazines();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save magazine');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">{editingMagazine ? 'Edit Magazine' : 'Create Magazine'}</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2 border rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Issue" value={issue} onChange={(e) => setIssue(e.target.value)} required className="w-full p-2 border rounded" />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-2 border rounded" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full p-2 border rounded" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded">
          <option value="Agriculture">Agriculture</option>
          <option value="Livestock">Livestock</option>
          <option value="Technology">Technology</option>
          <option value="Business">Business</option>
          <option value="Sustainability">Sustainability</option>
          <option value="Research">Research</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Keywords (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <textarea placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows="3" className="w-full p-2 border rounded" />

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="published" className="text-sm">Published</label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="featured" className="text-sm">Featured content</label>
        </div>
      </div>
      <div ref={quillRef} className="h-40 bg-gray-100 border p-2 rounded"></div>
      <input type="file" onChange={handleImageChange} accept="image/*" className="w-full p-2 border rounded" />
      {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover mt-2" />}
      <input type="file" onChange={(e) => setPdf(e.target.files[0])} accept=".pdf" className="w-full p-2 border rounded" />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">{editingMagazine ? 'Update Content' : 'Publish Content'}</button>
    </form>
  );
};

export default MagazineForm;
