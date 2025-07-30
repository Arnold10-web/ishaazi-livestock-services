/**
 * @file User Model (Enhanced Admin System)
 * @description Enhanced user schema supporting dual-role admin system:
 *  - System Admin: Username + Password authentication, full system access
 *  - Editor: Company Email + Password authentication, content management access
 *  - Activity tracking and audit trail
 *  - Backward compatibility with existing Admin model
 * @module models/User
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @constant {mongoose.Schema} UserSchema
 * @description Enhanced schema for dual-role admin system
 */
const UserSchema = new mongoose.Schema({
    // Session Management
    sessions: [{
        token: String,
        deviceInfo: Object,
        createdAt: Date,
        lastActivity: Date
    }],

    // Security Management
    loginAttempts: [{
        timestamp: Date,
        success: Boolean,
        ip: String,
        userAgent: String
    }],
    accountLocked: { type: Boolean, default: false },
    lockedUntil: Date,
    passwordHistory: [String], // Store last 5 password hashes
    knownIPs: [String],
    lastLoginAt: Date,
    /**
     * @property {String} username - Optional internal identifier (can be auto-generated)
     */
    username: { 
        type: String, 
        unique: true,
        sparse: true, // Allows null/undefined, but enforces uniqueness when present
        required: false, // Username is now optional for all roles
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    
    /**
     * @property {String} email - Required email field for all users including system_admin
     */
    email: { 
        type: String, 
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        required: true, // Email is now required for all roles including system_admin
        validate: {
            validator: function(v) {
                return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },

    /**
     * @property {String} companyEmail - Required for editor role
     */
    companyEmail: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        required: function() {
            return this.role === 'editor' || this.role === 'admin';
        },
        validate: {
            validator: function(v) {
                // Company email is required for editors and admins
                if ((this.role === 'editor' || this.role === 'admin') && !v) {
                    return false;
                }
                // If provided, must be a valid email
                return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Editor/Admin must have a valid company email address'
        }
    },
    
    /**
     * @property {Boolean} hasSetPassword - Indicates if the user has set their permanent password
     */
    hasSetPassword: {
        type: Boolean,
        default: false
    },
    
    /**
     * @property {String} password - Hashed password
     */
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    
    /**
     * @property {String} role - User role for access control
     */
    role: { 
        type: String, 
        enum: ['system_admin', 'editor'], // Only two roles allowed
        default: 'editor',
        required: true
    },
    
    /**
     * @property {Boolean} isTemporaryPassword - Flag for temporary passwords
     */
    isTemporaryPassword: {
        type: Boolean,
        default: false
    },
    
    /**
     * @property {ObjectId} createdBy - Reference to user who created this account
     */
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() { return this.role === 'editor'; }
    },
    
    /**
     * @property {Date} lastLogin - Timestamp of most recent login
     */
    lastLogin: { 
        type: Date, 
        default: null 
    },
    
    /**
     * @property {Number} loginCount - Total number of successful logins
     */
    loginCount: { 
        type: Number, 
        default: 0 
    },
    
    /**
     * @property {Array} loginHistory - Recent login activity
     */
    loginHistory: [{
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
        success: { type: Boolean, default: true },
        _id: false // Disable _id for subdocuments
    }],
    
    /**
     * @property {Boolean} isActive - Account status
     */
    isActive: {
        type: Boolean,
        default: true
    },
    
    /**
     * @property {Date} passwordChangedAt - Last password change timestamp
     */
    passwordChangedAt: {
        type: Date,
        default: Date.now
    },
    
    /**
     * @property {Number} failedLoginAttempts - Failed login counter
     */
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    
    /**
     * @property {Date} lockedUntil - Account lock expiration
     */
    lockedUntil: Date,
    
    /**
     * @property {Object} preferences - User preferences and settings
     */
    preferences: {
        timezone: { type: String, default: 'UTC' },
        language: { type: String, default: 'en' },
        emailNotifications: { type: Boolean, default: true },
        dashboardLayout: { type: String, default: 'default' },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
        pageSize: { type: Number, default: 10, min: 5, max: 100 }
    },
    
    /**
     * @property {Array} permissions - Specific permissions for fine-grained access control
     */
    permissions: [{
        type: String,
        enum: [
            'manage_users', 'manage_content', 'manage_subscribers', 'manage_newsletters',
            'manage_events', 'manage_auctions', 'view_analytics', 'manage_system_settings'
        ]
    }],
    
    /**
     * @property {String} profileImage - URL to user's profile image
     */
    profileImage: {
        type: String,
        default: null
    },
    
    /**
     * @property {String} firstName - User's first name
     */
    firstName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    
    /**
     * @property {String} lastName - User's last name
     */
    lastName: {
        type: String,
        trim: true,
        maxlength: 50
    }
}, { 
    timestamps: true,
    // Add virtual for account lock status
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Virtual for checking if account is locked
 */
UserSchema.virtual('isLocked').get(function() {
    return !!(this.failedLoginAttempts >= 5 && this.lockedUntil && this.lockedUntil > Date.now());
});

/**
 * Virtual for getting login email (companyEmail for editors, email for others)
 */
UserSchema.virtual('loginEmail').get(function() {
    return this.role === 'editor' ? this.companyEmail : this.email;
});

/**
 * Virtual for getting full name
 */
UserSchema.virtual('fullName').get(function() {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username || this.loginEmail;
});

/**
 * Virtual for getting display name (for UI)
 */
UserSchema.virtual('displayName').get(function() {
    return this.fullName || this.username || this.loginEmail || 'Unknown User';
});

/**
 * Pre-save middleware to hash password
 */
UserSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.passwordChangedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware for role-specific validation
 */
UserSchema.pre('save', function(next) {
    // Ensure system_admin has email (username is optional)
    if (this.role === 'system_admin' && !this.email) {
        return next(new Error('System admin must have an email address'));
    }
    
    // Auto-generate username for system_admin if not provided
    if (this.role === 'system_admin' && !this.username) {
        this.username = this.email.split('@')[0] + '_admin';
    }
    
    // Ensure editor has company email
    if (this.role === 'editor' && !this.companyEmail) {
        return next(new Error('Editor must have a company email'));
    }
    
    next();
});

/**
 * Instance method to compare password
 */
UserSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

/**
 * Instance method to record login
 */
UserSchema.methods.recordLogin = function(ipAddress, userAgent, success = true) {
    if (success) {
        this.lastLogin = new Date();
        this.loginCount += 1;
        this.failedLoginAttempts = 0;
        this.lockedUntil = undefined;
    } else {
        this.failedLoginAttempts += 1;
        
        // Lock account after 5 failed attempts for 30 minutes
        if (this.failedLoginAttempts >= 5) {
            this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
    }
    
    // Add to login history (keep last 10 entries)
    this.loginHistory.unshift({
        timestamp: new Date(),
        ipAddress,
        userAgent,
        success
    });
    
    // Keep only last 10 login attempts
    if (this.loginHistory.length > 10) {
        this.loginHistory = this.loginHistory.slice(0, 10);
    }
    
    return this.save();
};

/**
 * Instance method to reset password
 */
UserSchema.methods.resetPassword = function(newPassword, isTemporary = false) {
    this.password = newPassword;
    this.isTemporaryPassword = isTemporary;
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    return this.save();
};

/**
 * Static method to find by login credentials
 */
UserSchema.statics.findByLoginCredentials = async function(identifier, password) {
    const User = this;
    
    // Determine if identifier is email or username
    const isEmail = identifier.includes('@');
    
    let query = {};
    if (isEmail) {
        // Check both email and companyEmail fields
        query = {
            $or: [
                { email: identifier.toLowerCase() },
                { companyEmail: identifier.toLowerCase() }
            ]
        };
    } else {
        // Username login
        query = { username: identifier };
    }
    
    const user = await User.findOne(query);
    
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    
    if (user.isLocked) {
        throw new Error('Account is temporarily locked due to failed login attempts');
    }
    
    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        // Record failed login
        await user.recordLogin(null, null, false);
        throw new Error('Invalid login credentials');
    }
    
    return user;
};

/**
 * Create indexes for performance - Note: Only define explicit indexes here
 * Mongoose automatically creates indexes for fields with unique: true in schema
 */
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ 'loginHistory.timestamp': -1 });
UserSchema.index({ lastLogin: -1 });

// Pre-save middleware to validate role-specific requirements
UserSchema.pre('save', function(next) {
    // System Admin validation
    if (this.role === 'system_admin') {
        if (!this.username) {
            return next(new Error('System admin must have a username'));
        }
        // Company email is not required for system admin
    }
    
    // Editor validation
    if (this.role === 'editor') {
        if (!this.companyEmail) {
            return next(new Error('Editor must have a company email'));
        }
    }

    next();
});

// Static method to create a system admin
UserSchema.statics.createSystemAdmin = async function(userData) {
    const user = new this({
        ...userData,
        role: 'system_admin'
    });
    await user.save();
    return user;
};

// Static method to create an editor
UserSchema.statics.createEditor = async function(userData) {
    if (!userData.companyEmail) {
        throw new Error('Company email is required for editor accounts');
    }
    const user = new this({
        ...userData,
        role: 'editor'
    });
    await user.save();
    return user;
};

// Method to validate role-specific requirements
UserSchema.methods.validateRoleRequirements = function() {
    if (this.role === 'system_admin') {
        if (!this.username) {
            throw new Error('System admin must have a username');
        }
    }
    
    if (this.role === 'editor') {
        if (!this.companyEmail) {
            throw new Error('Editor must have a company email');
        }
    }
    
    return true;
};

const User = mongoose.model('User', UserSchema);

export default User;
