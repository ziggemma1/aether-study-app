import express from 'express';
import { register, login, logout, getMe, getGoogleAuthUrl, googleCallback } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/google-url', getGoogleAuthUrl);
router.get('/google-callback', googleCallback);

export default router;
