import express from 'express';
import { getAllProfiles, updateProfile, toggleFollow } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profiles', getAllProfiles);
router.put('/profile', updateProfile);
router.post('/follow/:id', toggleFollow);

export default router;
