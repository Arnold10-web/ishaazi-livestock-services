import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordSetupTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Token expires after 24 hours
    },
    used: {
        type: Boolean,
        default: false
    }
});

// Compound index for efficient queries by userId and used status
passwordSetupTokenSchema.index({ userId: 1, used: 1 });

// Generate a secure token
passwordSetupTokenSchema.statics.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

// Hash the token before saving
passwordSetupTokenSchema.pre('save', function(next) {
    if (this.isModified('token')) {
        this.token = crypto.createHash('sha256').update(this.token).digest('hex');
    }
    next();
});

const PasswordSetupToken = mongoose.model('PasswordSetupToken', passwordSetupTokenSchema);
export default PasswordSetupToken;
