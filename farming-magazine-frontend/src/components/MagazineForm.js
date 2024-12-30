import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';
import '../css/MagazineForm.css';

const MagazineForm = ({ refreshMagazines, editingMagazine, setEditingMagazine }) => {
  const [title, setTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [pricingStrategy, setPricingStrategy] = useState({
    type: 'fixed', // 'fixed', 'time-based', 'free'
    basePrice: '',
    discountSchedule: [
      { days: 30, percentage: 20 },
      { days: 60, percentage: 50 },
      { days: 90, percentage: 100 }, // Free after 90 days
    ],
  });
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingMagazine) {
      setTitle(editingMagazine.title);
      setIssue(editingMagazine.issue);
      setPrice(editingMagazine.price.toString());
      setDiscount(editingMagazine.discount ? editingMagazine.discount.toString() : '');
      setMetadata(JSON.stringify(editingMagazine.metadata));
      setImagePreview(editingMagazine.imageUrl);
      setPricingStrategy(editingMagazine.pricingStrategy || {
        type: 'fixed',
        basePrice: editingMagazine.price,
        discountSchedule: [
          { days: 30, percentage: 20 },
          { days: 60, percentage: 50 },
          { days: 90, percentage: 100 },
        ],
      });
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

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    setPdf(file);
  };

  const resetForm = () => {
    setTitle('');
    setIssue('');
    setPrice('');
    setDiscount('');
    setMetadata('{}');
    setImage(null);
    setPdf(null);
    setImagePreview(null);
    setPricingStrategy({
      type: 'fixed',
      basePrice: '',
      discountSchedule: [
        { days: 30, percentage: 20 },
        { days: 60, percentage: 50 },
        { days: 90, percentage: 100 },
      ],
    });
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingMagazine(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title.trim() || !issue.trim() || !description.trim()) {
      setError('Title, issue, and description are required.');
      return;
    }

    try {
      JSON.parse(metadata);
    } catch {
      setError('Invalid metadata JSON format.');
      return;
    }

    if (!image || !pdf) {
      setError('Both image and PDF file are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('issue', issue);
    formData.append('price', price);
    formData.append('discount', discount);
    formData.append('description', description);
    formData.append('metadata', metadata);
    formData.append('image', image);
    formData.append('pdf', pdf);
    formData.append('pricingStrategy', JSON.stringify(pricingStrategy));

    try {
      setError('');
      if (editingMagazine) {
        await axios.put(`${API_ENDPOINTS.UPDATE_MAGAZINE}/${editingMagazine._id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Magazine updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_MAGAZINE, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('Magazine created successfully!');
      }
      refreshMagazines();
      resetForm();
    } catch (error) {
      console.error('Error saving magazine:', error);
      setError(error.response?.data?.message || 'Failed to save magazine');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="magazine-form">
      <h3>{editingMagazine ? 'Edit Magazine' : 'Create Magazine'}</h3>
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Issue"
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        required
      />
      <div className="pricing-section">
        <h4>Pricing Strategy</h4>
        <select
          value={pricingStrategy.type}
          onChange={(e) =>
            setPricingStrategy({ ...pricingStrategy, type: e.target.value })
          }
        >
          <option value="fixed">Fixed Price</option>
          <option value="time-based">Time-Based Discounts</option>
          <option value="free">Free</option>
        </select>
        {pricingStrategy.type !== 'free' && (
          <input
            type="number"
            step="0.01"
            placeholder="Base Price"
            value={pricingStrategy.basePrice}
            onChange={(e) =>
              setPricingStrategy({ ...pricingStrategy, basePrice: e.target.value })
            }
            required
          />
        )}
        {pricingStrategy.type === 'time-based' && (
          <div className="discount-schedule">
            <h5>Discount Schedule</h5>
            {pricingStrategy.discountSchedule.map((discount, index) => (
              <div key={index} className="discount-entry">
                <input
                  type="number"
                  placeholder="Days"
                  value={discount.days}
                  onChange={(e) => {
                    const newSchedule = [...pricingStrategy.discountSchedule];
                    newSchedule[index].days = parseInt(e.target.value, 10);
                    setPricingStrategy({
                      ...pricingStrategy,
                      discountSchedule: newSchedule,
                    });
                  }}
                />
                <input
                  type="number"
                  placeholder="Discount %"
                  value={discount.percentage}
                  onChange={(e) => {
                    const newSchedule = [...pricingStrategy.discountSchedule];
                    newSchedule[index].percentage = parseInt(e.target.value, 10);
                    setPricingStrategy({
                      ...pricingStrategy,
                      discountSchedule: newSchedule,
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={quillRef} className="quill-editor" style={{ height: '300px', marginBottom: '1rem' }}></div>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      <input type="file" onChange={handlePdfChange} accept=".pdf" />
      {imagePreview && (
        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
      )}
      <button type="submit">{editingMagazine ? 'Update Magazine' : 'Create Magazine'}</button>
      {editingMagazine && <button type="button" onClick={resetForm}>Cancel Edit</button>}
    </form>
  );
};

export default MagazineForm;
