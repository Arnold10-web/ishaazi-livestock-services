// src/admin/MagazineManagement.js
import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../config/apiConfig'; // Adjust API endpoints as needed
import '../css/magazinemanagement.css';

const MagazineManagement = () => {
    const [magazines, setMagazines] = useState([]);
    const [newMagazine, setNewMagazine] = useState({ title: '', description: '', price: '', discount: '', pdfURL: '' });
    const [editMagazine, setEditMagazine] = useState(null);

    useEffect(() => {
        fetchMagazines();
    }, []);

    // Fetch all magazines from the backend
    const fetchMagazines = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.GET_MAGAZINES);
            const data = await response.json();
            setMagazines(data);
        } catch (error) {
            console.error("Error fetching magazines:", error);
        }
    };

    // Handle input changes for new and edit magazine forms
    const handleChange = (e, magazineType = "new") => {
        const { name, value } = e.target;
        if (magazineType === "new") {
            setNewMagazine({ ...newMagazine, [name]: value });
        } else {
            setEditMagazine({ ...editMagazine, [name]: value });
        }
    };

    // Add a new magazine
    const handleAddMagazine = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.ADD_MAGAZINE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMagazine)
            });
            const data = await response.json();
            setMagazines([...magazines, data]);
            setNewMagazine({ title: '', description: '', price: '', discount: '', pdfURL: '' });
        } catch (error) {
            console.error("Error adding magazine:", error);
        }
    };

    // Update an existing magazine
    const handleEditMagazine = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_ENDPOINTS.UPDATE_MAGAZINE}/${editMagazine._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editMagazine)
            });
            const data = await response.json();
            setMagazines(magazines.map(mag => (mag._id === data._id ? data : mag)));
            setEditMagazine(null);
        } catch (error) {
            console.error("Error updating magazine:", error);
        }
    };

    // Delete a magazine
    const handleDeleteMagazine = async (id) => {
        try {
            await fetch(`${API_ENDPOINTS.DELETE_MAGAZINE}/${id}`, { method: 'DELETE' });
            setMagazines(magazines.filter(mag => mag._id !== id));
        } catch (error) {
            console.error("Error deleting magazine:", error);
        }
    };

    return (
        <div className="magazine-management container">
            <h2>Magazine Management</h2>

            {/* Add Magazine Form */}
            <form onSubmit={handleAddMagazine}>
                <h3>Add New Magazine</h3>
                <input type="text" name="title" value={newMagazine.title} onChange={(e) => handleChange(e)} placeholder="Title" required />
                <input type="text" name="description" value={newMagazine.description} onChange={(e) => handleChange(e)} placeholder="Description" required />
                <input type="number" name="price" value={newMagazine.price} onChange={(e) => handleChange(e)} placeholder="Price" required />
                <input type="number" name="discount" value={newMagazine.discount} onChange={(e) => handleChange(e)} placeholder="Discount" required />
                <input type="url" name="pdfURL" value={newMagazine.pdfURL} onChange={(e) => handleChange(e)} placeholder="PDF URL" required />
                <button type="submit">Add Magazine</button>
            </form>

            {/* Edit Magazine Form */}
            {editMagazine && (
                <form onSubmit={handleEditMagazine}>
                    <h3>Edit Magazine</h3>
                    <input type="text" name="title" value={editMagazine.title} onChange={(e) => handleChange(e, "edit")} placeholder="Title" required />
                    <input type="text" name="description" value={editMagazine.description} onChange={(e) => handleChange(e, "edit")} placeholder="Description" required />
                    <input type="number" name="price" value={editMagazine.price} onChange={(e) => handleChange(e, "edit")} placeholder="Price" required />
                    <input type="number" name="discount" value={editMagazine.discount} onChange={(e) => handleChange(e, "edit")} placeholder="Discount" required />
                    <input type="url" name="pdfURL" value={editMagazine.pdfURL} onChange={(e) => handleChange(e, "edit")} placeholder="PDF URL" required />
                    <button type="submit">Update Magazine</button>
                    <button type="button" onClick={() => setEditMagazine(null)}>Cancel</button>
                </form>
            )}

            {/* Display Magazines List */}
            <h3>Existing Magazines</h3>
            <ul>
                {magazines.map(magazine => (
                    <li key={magazine._id}>
                        <h4>{magazine.title}</h4>
                        <p>{magazine.description}</p>
                        <p>Price: ${magazine.price}</p>
                        <p>Discount: {magazine.discount}%</p>
                        <button onClick={() => setEditMagazine(magazine)}>Edit</button>
                        <button onClick={() => handleDeleteMagazine(magazine._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MagazineManagement;
