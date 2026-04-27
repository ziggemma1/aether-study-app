import express from 'express';
import { getRooms, createRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getRooms);
router.post('/', createRoom);

export default router;
