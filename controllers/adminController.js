// controllers/adminController.js
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

// Admin Registration
export async function registerAdmin(req, res) {
    const { username, password } = req.body;

    try {
        // Check if admin username already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create and save new admin
        const admin = new Admin({ username, password });
        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Admin registration failed' });
    }
};

// Admin Login
export async function loginAdmin(req, res) {
    const { username, password } = req.body;
    console.log('Login attempt:', { username }); // Debug log

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ username });
        if (!admin) {
            console.log('Admin not found');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful, token:', token);

        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Admin Logout
export function logoutAdmin(req, res) {
    // Clear token on client-side, logout functionality is usually front-end driven
    res.status(200).json({ message: 'Admin logged out successfully' });
};

// Admin Dashboard (Protected)
export function getAdminDashboard(req, res) {
    res.status(200).json({ message: `Welcome to the admin dashboard, Admin ID: ${req.adminId}` });
};