// src/admin/MediaManagement.js
import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/apiConfig';
import '../css/style.css'; 

const MediaManagement = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [mediaType, setMediaType] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedMedia, setUploadedMedia] = useState([]);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setUploadStatus('');
    };

    const handleTypeChange = (e) => {
        setMediaType(e.target.value);
        setUploadStatus('');
        setSelectedFile(null); // Clear file when changing media type
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !mediaType) {
            setUploadStatus('Please select a file and a media type to upload.');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setUploadStatus('File size exceeds the 5MB limit.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', mediaType);

        try {
            const response = await fetch(API_ENDPOINTS.UPLOAD_MEDIA, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setUploadStatus('File uploaded successfully!');
                fetchUploadedMedia();
                setSelectedFile(null);
                setMediaType('');
            } else {
                setUploadStatus(data.message || 'Error uploading file.');
            }
        } catch (error) {
            setUploadStatus('Error uploading file. Please try again.');
            console.error('Error uploading file:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUploadedMedia = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GET_MEDIA);
            const data = await response.json();
            setUploadedMedia(data || []);
        } catch (error) {
            console.error('Error fetching media:', error);
            setUploadStatus('Failed to fetch media items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploadedMedia();
    }, []);

    const handleDeleteMedia = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.DELETE_MEDIA}/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok) {
                setUploadStatus('Media deleted successfully!');
                fetchUploadedMedia();
            } else {
                setUploadStatus(data.message || 'Error deleting media.');
            }
        } catch (error) {
            setUploadStatus('Error deleting media. Please try again.');
            console.error('Error deleting media:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="media-management container">
            <h2>Media Management</h2>
            <form onSubmit={handleUpload}>
                <label>
                    <strong>Select Media Type:</strong>
                    <select value={mediaType} onChange={handleTypeChange} required>
                        <option value="">Select Type</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="article">Article</option>
                        <option value="magazine">Magazine</option>
                    </select>
                </label>

                <label>
                    <strong>Select File:</strong>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        required
                        accept={
                            mediaType === 'image' ? 'image/*' :
                            mediaType === 'video' ? 'video/*' :
                            mediaType === 'audio' ? 'audio/*' :
                            mediaType === 'article' ? '.pdf, .doc, .docx' :
                            'application/pdf'
                        }
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
                {uploadStatus && <p>{uploadStatus}</p>}
            </form>

            {/* Media display and delete functionality */}
            <div className="media-display">
                <h3>Uploaded Media</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <ul>
                        {uploadedMedia.map((media) => (
                            <li key={media._id}>
                                <p>{media.name}</p>
                                <button onClick={() => handleDeleteMedia(media._id)} disabled={loading}>
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                                <a href={`${API_ENDPOINTS.GET_MEDIA_FILE}/${media._id}`} download>
                                    Download
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MediaManagement;
