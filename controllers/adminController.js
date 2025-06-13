/**
 * @file Admin Controller
 * @description Handles authentication, authorization, and admin management:
 *  - Authentication (login/logout)
 *  - Admin account registration and profile management
 *  - Access control for admin dashboard
 *  - JWT token generation and validation
 * @module controllers/adminController
 */

import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

/**
 * @function registerAdmin
 * @description Creates a new admin account with secure password hashing
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - Admin username
 * @param {string} req.body.password - Admin password (will be hashed)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response indicating success or failure
 */
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

/**
 * @function loginAdmin
 * @description Authenticates admin credentials and issues a JWT token
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - Admin username
 * @param {string} req.body.password - Admin password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with authentication token and admin data
 */
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

/**
 * @function logoutAdmin
 * @description Handles admin logout process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming logout
 */
export function logoutAdmin(req, res) {
    // Clear token on client-side, logout functionality is usually front-end driven
    res.status(200).json({ message: 'Admin logged out successfully' });
};

/**
 * @function getAdminDashboard
 * @description Protected route that verifies admin authorization
 * @param {Object} req - Express request object
 * @param {string} req.adminId - Admin ID from JWT verification middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with welcome message
 */
export function getAdminDashboard(req, res) {
    res.status(200).json({ message: `Welcome to the admin dashboard, Admin ID: ${req.adminId}` });
}

/**
 * @function getAdminProfile
 * @description Retrieves the current admin's profile information
 * @param {Object} req - Express request object
 * @param {Object} req.admin - Admin object from authentication middleware
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with admin profile data
 */
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

/**
 * @function updateAdminProfile
 * @description Updates admin profile information
 * @param {Object} req - Express request object
 * @param {Object} req.admin - Admin object from authentication middleware
 * @param {Object} req.body - Request body with fields to update
 * @param {string} [req.body.username] - New username
 * @param {string} [req.body.email] - New email
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated admin profile
 */
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

/**
 * @function deleteAdmin
 * @description Deletes an admin account (superadmin role required)
 * @param {Object} req - Express request object
 * @param {Object} req.admin - Admin object from authentication middleware
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - ID of admin to delete
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
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

/**
 * Default export of all admin controller functions
 * @exports {Object} Admin controller functions
 */
export default { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard, getAdminProfile, updateAdminProfile, deleteAdmin };