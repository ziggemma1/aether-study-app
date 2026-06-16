import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserAchievements, checkAchievements } from '../services/achievement-service.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const data = await getUserAchievements(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/action', protect, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { action, clientData } = req.body;
    
    // Sync current achievements of study, quiz, etc.
    const newlyUnlocked = await checkAchievements(userId, action, clientData);
    const updatedData = await getUserAchievements(userId);
    
    res.json({
      newlyUnlocked,
      ...updatedData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
