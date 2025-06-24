/**
 * FarmForm Component
 * 
 * Form component for creating and editing farm listings.
 * Features rich text editing for farm descriptions, image upload,
 * and property details entry. Handles both new farms and editing
 * existing farm listings.
 * 
 * @module components/FarmForm
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import { useAlert } from '../hooks/useAlert';


/**
 * Form component for creating and editing farm listings
 * 
 * @param {Object} props - Component props
 * @param {Function} props.refreshFarms - Callback to refresh farms list after submission
 * @param {Object|null} props.editingFarm - Farm object being edited, null for new farms
 * @param {Function} props.setEditingFarm - Function to clear editing state
 * @returns {JSX.Element} Rendered farm form component
 */
const FarmForm = ({ refreshFarms, editingFarm, setEditingFarm }) => {
  // Farm property state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  
  // Image handling state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UI state
  const [error, setError] = useState('');
  const alert = useAlert();
  
  // Rich text editor references
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
  const handlePriceChange = (e) => {
    // Remove non-digit characters and allow commas
    const value = e.target.value.replace(/[^0-9,]/g, '');
    setPrice(value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';

    // Remove commas and convert to number
    const cleanPrice = price.replace(/,/g, '');

    if (!name.trim() || !cleanPrice || !location.trim() || !description.trim()) {
      setError('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', Number(cleanPrice));
    formData.append('location', location);
    formData.append('description', description);
    if (image) formData.append('image', image);

    try {
      setError('');
      if (editingFarm) {
        await axios.put(API_ENDPOINTS.UPDATE_FARM(editingFarm._id), formData,{
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Farm updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_FARM, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert.success('Farm created successfully!');
      }
      refreshFarms();
      resetForm();
    } catch (error) {
      console.error('Error saving farm:', error);
      setError(error.response?.data?.message || 'Failed to save farm');
    }
  };

  return (
<div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 py-4 px-6">
        <h3 className="text-2xl font-bold text-white">
          {editingFarm ? 'Edit Farm' : 'Add New Farm'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md dark:bg-red-900/30 dark:border-red-400" role="alert">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="farm-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Farm Name
          </label>
          <input
            id="farm-name"
            type="text"
            placeholder="Enter farm name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="farm-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <input
            id="farm-location"
            type="text"
            placeholder="Enter farm location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
        <label htmlFor="farm-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Price (UGX)
        </label>
        <input
          id="farm-price"
          type="text"
          placeholder="Enter farm price (e.g. 50,000,000)"
          value={price}
          onChange={handlePriceChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white transition-colors duration-200 ease-in-out"
          aria-required="true"
        />
      </div>

        <div className="space-y-2">
          <label htmlFor="farm-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Farm Image
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
              id="farm-image"
            />
            <label
              htmlFor="farm-image"
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200 cursor-pointer flex items-center dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose Image
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {image ? image.name : 'No file chosen'}
            </span>
          </div>

          {imagePreview && (
            <div className="mt-4 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="farm-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <div
            className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500"
          >
            <div ref={quillRef} className="h-72 bg-white dark:bg-gray-700"></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {editingFarm ? 'Update Farm' : 'Add Farm'}
          </button>

          {editingFarm && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FarmForm;