import express from 'express';
import { getAllProfiles } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/profiles', getAllProfiles);

export default router;
