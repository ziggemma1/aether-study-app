import express from 'express';
import { getResults, createResult } from '../controllers/quizController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getResults);
router.post('/', createResult);

export default router;
