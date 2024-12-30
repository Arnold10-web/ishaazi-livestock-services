import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import '../css/FarmForm.css';
const FarmForm = ({ refreshFarms, editingFarm, setEditingFarm }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingFarm) {
      setName(editingFarm.name);
      setPrice(editingFarm.price.toString());
      setLocation(editingFarm.location);
      setImagePreview(editingFarm.imageUrl);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingFarm.description;
      }
    }
  }, [editingFarm, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your farm description here...',
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
    setName('');
    setPrice('');
    setLocation('');
    setImage(null);
    setImagePreview(null);
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingFarm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';

    // Validate required fields
    if (!name.trim() || !price || !location.trim() || !description.trim()) {
      setError('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', Number(price));
    formData.append('location', location);
    formData.append('description', description);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingFarm) {
        await axios.put(`${API_ENDPOINTS.UPDATE_FARM}/${editingFarm._id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Farm updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_FARM, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Farm created successfully!');
      }
      refreshFarms();
      resetForm();
    } catch (error) {
      console.error('Error saving farm:', error);
      setError(error.response?.data?.message || 'Failed to save farm');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="farm-form">
      <h3>{editingFarm ? 'Edit Farm' : 'Add New Farm'}</h3>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        placeholder="Farm Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <input type="file" onChange={handleImageChange} />
      {imagePreview && (
        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
      )}
     <div ref={quillRef} className="quill-editor" style={{ height: '300px', marginBottom: '1rem' }}></div>
      <button type="submit">{editingFarm ? 'Update Farm' : 'Add Farm'}</button>
      {editingFarm && <button type="button" onClick={resetForm}>Cancel Edit</button>}
    </form>
  );
};

export default FarmForm;