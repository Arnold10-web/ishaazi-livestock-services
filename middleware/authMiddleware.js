// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied: No token provided' 
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Malformed authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure user still exists
    const user = await Admin.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User not found'
      });
    }

    req.user = user;
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// Authorization middleware
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: User not authenticated'
      });
    }

    if (roles.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No roles specified'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    next();
  };
};

// Convenience function for admin authentication
export const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied: No token provided' 
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Malformed authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure user still exists
    const user = await Admin.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User not found'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    req.user = user;
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// Legacy default export for backward compatibility
const authMiddleware = authenticateToken;
export default authMiddleware;