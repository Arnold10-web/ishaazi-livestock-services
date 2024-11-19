// controllers/magazineController.js
const Magazine = require('../models/Magazine');

// Create a new magazine entry
const createMagazine = async (req, res) => {
    try {
        const { title, description, price, discount, fileUrl } = req.body;
        const newMagazine = new Magazine({
            title,
            description,
            price,
            discount,
            fileUrl,
        });
        await newMagazine.save();
        res.status(201).json({ message: 'Magazine created successfully', magazine: newMagazine });
    } catch (error) {
        res.status(500).json({ message: 'Error creating magazine', error });
    }
};

// Retrieve all magazines
const getMagazines = async (req, res) => {
    try {
        const magazines = await Magazine.find();
        res.json(magazines);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching magazines', error });
    }
};

// Update magazine details
const updateMagazine = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMagazine = await Magazine.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedMagazine) return res.status(404).json({ message: 'Magazine not found' });
        res.json({ message: 'Magazine updated successfully', magazine: updatedMagazine });
    } catch (error) {
        res.status(500).json({ message: 'Error updating magazine', error });
    }
};

// Delete a magazine
const deleteMagazine = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMagazine = await Magazine.findByIdAndDelete(id);
        if (!deletedMagazine) return res.status(404).json({ message: 'Magazine not found' });
        res.json({ message: 'Magazine deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting magazine', error });
    }
};

module.exports = { createMagazine, getMagazines, updateMagazine, deleteMagazine };
