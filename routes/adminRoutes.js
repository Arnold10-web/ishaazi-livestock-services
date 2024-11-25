// routes/adminRoutes.js

const express = require('express');
const { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', (req, res) => {
    try {
        registerAdmin(req, res);
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Error registering admin' });
    }
});

router.post('/login', (req, res) => {
    try {
        loginAdmin(req, res);
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ message: 'Error logging in admin' });
    }
});

router.post('/logout', authMiddleware, (req, res) => {
    try {
        logoutAdmin(req, res);
    } catch (error) {
        console.error('Error logging out admin:', error);
        res.status(500).json({ message: 'Error logging out admin' });
    }
});

router.get('/dashboard', authMiddleware, (req, res) => {
    try {
        getAdminDashboard(req, res);
    } catch (error) {
        console.error('Error getting admin dashboard:', error);
        res.status(500).json({ message: 'Error getting admin dashboard' });
    }
});

module.exports = router; 

//suggested change in adminRoutes.js

 /*routes/adminRoutes.js
const express = require('express');
const { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Admin routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/logout', authMiddleware, logoutAdmin);
router.get('/dashboard', authMiddleware, getAdminDashboard);

module.exports = router;*/
