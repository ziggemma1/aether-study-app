import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/profiles', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/friend-request', async (req, res) => {
  res.status(200).json({ message: 'Friend request sent' });
});

router.get('/friend-requests', async (req, res) => {
  res.status(200).json([]);
});

router.post('/friend-request/respond', async (req, res) => {
  res.status(200).json({ message: 'Responded' });
});

export default router;
