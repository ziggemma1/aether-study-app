import express from 'express';
import StudySession from '../models/StudySession.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sessions = await StudySession.find();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const session = await StudySession.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
