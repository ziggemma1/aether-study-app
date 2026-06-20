import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMessages);
router.post('/', sendMessage);

export default router;
