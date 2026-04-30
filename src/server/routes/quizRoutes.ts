import express from 'express';
import { getResults, createResult } from '../controllers/quizController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);

router.get('/results', getResults);
router.post('/results', createResult);

export default router;
