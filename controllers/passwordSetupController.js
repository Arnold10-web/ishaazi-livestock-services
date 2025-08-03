import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordSetupToken from '../models/PasswordSetupToken.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const createPasswordSetupToken = async (userId) => {
    try {
        const token = PasswordSetupToken.generateToken();
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        await PasswordSetupToken.create({
            userId,
            token: hashedToken
        });

        return token;
    } catch (error) {
        throw new Error('Error generating password setup token');
    }
};

export const generatePasswordSetupLink = (token) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/set-password/${token}`;
};

export const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                message: 'Password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        // Hash the provided token for comparison
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid token
        const setupToken = await PasswordSetupToken.findOne({
            token: hashedToken,
            used: false,
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within 24 hours
        });

        if (!setupToken) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Find user
        const user = await User.findById(setupToken.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash password and update user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.hasSetPassword = true;
        user.isTemporaryPassword = false; // Clear temporary password flag
        await user.save();

        // Mark token as used
        setupToken.used = true;
        await setupToken.save();

        // Generate JWT token for automatic login
        const jwtToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Password set successfully',
            token: jwtToken
        });
    } catch (error) {
        console.error('Password setup error:', error);
        res.status(500).json({ message: 'Error setting up password' });
    }
};
