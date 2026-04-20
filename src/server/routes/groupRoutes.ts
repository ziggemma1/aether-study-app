import express from 'express';
import { createGroup, getGroups, addMember } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getGroups);
router.post('/', createGroup);
router.post('/add-member', addMember);

export default router;
