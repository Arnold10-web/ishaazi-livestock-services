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

        // Update last login info BEFORE generating token
        const currentLogin = new Date();
        await Admin.findByIdAndUpdate(admin._id, {
            lastLogin: currentLogin,
            $inc: { loginCount: 1 }
        });

        // Generate JWT
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful, token:', token);

        // Get updated admin data with new lastLogin
        const updatedAdmin = await Admin.findById(admin._id).select('-password');

        res.status(200).json({ 
            token, 
            message: 'Login successful',
            admin: updatedAdmin
        });
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
}

// Get admin profile
export async function getAdminProfile(req, res) {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.status(200).json(admin);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        res.status(500).json({ error: 'Failed to get admin profile' });
    }
}

// Update admin profile
export async function updateAdminProfile(req, res) {
    try {
        const { username, email } = req.body;
        
        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const admin = await Admin.findByIdAndUpdate(
            req.admin.id,
            { username, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.status(200).json(admin);
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ error: 'Failed to update admin profile' });
    }
}

// Delete admin
export async function deleteAdmin(req, res) {
    try {
        const { id } = req.params;
        
        // Check if the current admin has superadmin permissions
        const currentAdmin = await Admin.findById(req.admin.id);
        if (!currentAdmin || currentAdmin.role !== 'superadmin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Failed to delete admin' });
    }
}

export default { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard, getAdminProfile, updateAdminProfile, deleteAdmin };