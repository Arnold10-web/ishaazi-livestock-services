// routes/adminRoutes.js
import express from 'express';
import { registerAdmin, loginAdmin, logoutAdmin, getAdminDashboard, getAdminProfile, updateAdminProfile, deleteAdmin } from '../controllers/adminController.js';
import { getDashboardStats, resetViewCounts } from '../controllers/dashboardController.js';
import { getSecurityStats, getSecurityAuditLog, updateSecuritySettings } from '../controllers/securityController.js';
import authMiddleware from '../middleware/authMiddleware.js';

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

// Profile routes
router.get('/profile', authMiddleware, (req, res) => {
    try {
        getAdminProfile(req, res);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        res.status(500).json({ message: 'Error getting admin profile' });
    }
});

router.put('/profile', authMiddleware, (req, res) => {
    try {
        updateAdminProfile(req, res);
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: 'Error updating admin profile' });
    }
});

// Stats route
router.get('/stats', authMiddleware, (req, res) => {
    try {
        getDashboardStats(req, res);
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ message: 'Error getting admin stats' });
    }
});

// Reset view counts route (for development)
router.post('/reset-views', authMiddleware, (req, res) => {
    try {
        resetViewCounts(req, res);
    } catch (error) {
        console.error('Error resetting view counts:', error);
        res.status(500).json({ message: 'Error resetting view counts' });
    }
});

// Delete admin route
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        deleteAdmin(req, res);
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Error deleting admin' });
    }
});

// Security routes
router.get('/security-stats', authMiddleware, (req, res) => {
    try {
        getSecurityStats(req, res);
    } catch (error) {
        console.error('Error getting security stats:', error);
        res.status(500).json({ message: 'Error getting security stats' });
    }
});

router.get('/security-audit', authMiddleware, (req, res) => {
    try {
        getSecurityAuditLog(req, res);
    } catch (error) {
        console.error('Error getting security audit log:', error);
        res.status(500).json({ message: 'Error getting security audit log' });
    }
});

router.put('/security-settings', authMiddleware, (req, res) => {
    try {
        updateSecuritySettings(req, res);
    } catch (error) {
        console.error('Error updating security settings:', error);
        res.status(500).json({ message: 'Error updating security settings' });
    }
});

export default router;