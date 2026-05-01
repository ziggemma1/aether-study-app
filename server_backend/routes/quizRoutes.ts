import express from 'express';
import QuizResult from '../models/QuizResult.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const results = await QuizResult.find();
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await QuizResult.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
