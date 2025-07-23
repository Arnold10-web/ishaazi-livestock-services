import express from 'express';
import { setupPassword } from '../controllers/passwordSetupController.js';

const router = express.Router();

// Route for setting up password
router.post('/setup', setupPassword);

export default router;
