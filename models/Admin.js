// models/Admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
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
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'superadmin'], 
        default: 'admin' 
    },
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 }
}, { timestamps: true });

AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

AdminSchema.methods.comparePassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

export default mongoose.model('Admin', AdminSchema);