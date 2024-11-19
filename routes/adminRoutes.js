const express = require('express');
const { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Admin registration route
router.post('/register', registerAdmin);

// Admin login route
router.post('/login', loginAdmin);

// Admin logout route
router.post('/logout', authMiddleware, logoutAdmin);

// Admin dashboard route (protected)
router.get('/dashboard', authMiddleware, getAdminDashboard);

module.exports = router;
