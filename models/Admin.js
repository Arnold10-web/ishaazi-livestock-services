/**
 * @file Admin Model
 * @description Schema definition for admin users with:
 *  - Authentication credentials
 *  - Role-based access control
 *  - Password encryption via bcrypt
 *  - Login activity tracking
 * @module models/Admin
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @constant {mongoose.Schema} AdminSchema
 * @description Schema definition for admin user documents
 */
const AdminSchema = new mongoose.Schema({
    /**
     * @property {String} username - Unique admin username for login
     */
    username: { type: String, required: true, unique: true },
    
    /**
     * @property {String} email - Admin email address with validation
     */
    email: { 
        type: String, 
        required: false, 
        unique: true,
        sparse: true, // Allow multiple null/undefined values
        validate: {
            validator: function(v) {
                return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    /**
     * @property {String} password - Hashed password (never stored in plain text)
     */
    password: { type: String, required: true },
    
    /**
     * @property {String} role - Permission level for access control
     * @enum ['admin', 'superadmin']
     */
    role: { 
        type: String, 
        enum: ['admin', 'superadmin'], 
        default: 'admin' 
    },
    
    /**
     * @property {Date} lastLogin - Timestamp of most recent login
     */
    lastLogin: { type: Date, default: null },
    
    /**
     * @property {Number} loginCount - Total number of logins
     */
    loginCount: { type: Number, default: 0 }
}, { timestamps: true });

/**
 * Pre-save middleware to hash password before saving
 * @function
 * @name preSave
 * @memberof module:models/Admin~AdminSchema
 * @param {Function} next - Mongoose middleware next function
 */
AdminSchema.pre('save', async function (next) {
    // Only hash the password if it's modified
    if (!this.isModified('password')) return next();
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Instance method to compare password with hashed password
 * @function
 * @name comparePassword
 * @memberof module:models/Admin~AdminSchema.methods
 * @param {string} password - Plain text password to compare
 * @returns {boolean} True if password matches, false otherwise
 */
AdminSchema.methods.comparePassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

/**
 * @constant {mongoose.Model} Admin
 * @description Mongoose model for admin users
 */
export default mongoose.model('Admin', AdminSchema);