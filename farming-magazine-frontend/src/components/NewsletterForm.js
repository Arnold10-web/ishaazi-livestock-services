import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const NewsletterForm = ({ refreshNewsletters, editingNewsletter, setEditingNewsletter }) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  useEffect(() => {
    if (editingNewsletter) {
      setTitle(editingNewsletter.title);
      if (quillEditor) {
        quillEditor.root.innerHTML = editingNewsletter.body;
      }
    }
  }, [editingNewsletter, quillEditor]);

  const initializeQuill = useCallback(() => {
    if (quillRef.current && !quillEditor) {
      const editor = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your newsletter content here...',
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

  const resetForm = () => {
    setTitle('');
    if (quillEditor) {
      quillEditor.setText('');
    }
    setEditingNewsletter(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = quillEditor ? quillEditor.root.innerHTML : '';

    // Validate required fields
    if (!title.trim() || !body.trim()) {
      setError('Title and content are required.');
      return;
    }

    const formData = { title, body };

    try {
      setError('');
      if (editingNewsletter) {
        await axios.put(`${API_ENDPOINTS.UPDATE_NEWSLETTER(editingNewsletter._id)}`, formData, {
          headers: getAuthHeader(),
        });
        alert('Newsletter updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.CREATE_NEWSLETTER, formData, {
          headers: getAuthHeader(),
        });
        alert('Newsletter created successfully!');
      }
      refreshNewsletters();
      resetForm();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      setError(error.response?.data?.message || 'Failed to save newsletter');
    }
  };

  const handleSend = async () => {
    if (!editingNewsletter) {
      alert('You can only send an existing newsletter. Save it first!');
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.SEND_NEWSLETTER(editingNewsletter._id), {}, {
        headers: getAuthHeader(),
      });
      alert('Newsletter sent successfully!');
      refreshNewsletters();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setError(error.response?.data?.message || 'Failed to send newsletter');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-form">
      <h3>{editingNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div
        ref={quillRef}
        className="newsletter-form-quill"
        style={{ height: '300px', marginBottom: '1rem' }}
      ></div>
      <button type="submit">{editingNewsletter ? 'Update Newsletter' : 'Create Newsletter'}</button>
      {editingNewsletter && (
        <>
          <button type="button" onClick={resetForm}>
            Cancel Edit
          </button>
          <button type="button" onClick={handleSend}>
            Send Newsletter
          </button>
        </>
      )}
    </form>
  );
};

export default NewsletterForm;
