// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.error('No Authorization header provided'); // Debug log
    return res.status(403).json({ message: 'Access denied: No token provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    console.log('Token Validated:', decoded); // Debug log
    next();
  } catch (error) {
    console.error('Error verifying token:', error); // Debug log
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;