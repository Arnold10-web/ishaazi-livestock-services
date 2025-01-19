// routes/adminRoutes.js
const express = require('express');
const { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard } = require('../controllers/adminController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/register', (req, res) => {
    try {
        registerAdmin(req, res);
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Error registering admin' });
    }
});

router.post('/login', loginAdmin);

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