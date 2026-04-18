import express from 'express';
import { getAllProfiles, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profiles', getAllProfiles);
router.put('/profile', updateProfile);

export default router;
