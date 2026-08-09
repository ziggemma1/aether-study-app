import express from 'express';
import {
  getMessages,
  sendMessage,
  getConversations,
  markConversationRead
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Before '/' so the literal path is not swallowed by a broader handler later.
router.get('/conversations', getConversations);
router.post('/read', markConversationRead);
router.get('/', getMessages);
router.post('/', sendMessage);

export default router;
