import express from 'express';
import { 
  login, 
  register, 
  logout, 
  getMe, 
  getGoogleAuthUrl, 
  googleCallback 
} from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.get('/google', getGoogleAuthUrl);
router.get('/google-callback', googleCallback);

export default router;
