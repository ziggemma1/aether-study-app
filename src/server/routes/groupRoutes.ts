import express from 'express';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);

router.get('/', (req, res) => res.json([]));

export default router;
