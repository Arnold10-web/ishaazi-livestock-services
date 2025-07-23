import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requirePasswordSetup = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if password needs to be set
        if (!user.hasSetPassword) {
            return res.status(403).json({
                message: 'Password setup required',
                requiresPasswordSetup: true
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
