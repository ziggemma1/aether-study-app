import express from 'express';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/top', async (req, res) => {
  try {
    const limitNum = parseInt(req.query.limit as string, 10) || 5;
    const userId = (req as any).userId;

    // Retrieve all opted-in profiles sorted by aetherPoints desc
    const allLeaderboardUsers = await User.find({ optedInLeaderboard: { $ne: false } })
      .sort({ aetherPoints: -1 })
      .select('name avatar aetherPoints id');

    const mappedUsers = allLeaderboardUsers.map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      points: u.aetherPoints || 0,
      avatar: u.avatar || null,
      id: u._id.toString()
    }));

    const leaderboard = mappedUsers.slice(0, limitNum);

    // Find current user's profile and dynamic rank
    const currentUserIndex = mappedUsers.findIndex(u => u.id === userId.toString());
    const currentUserObj = await User.findById(userId);

    const currentUser = {
      rank: currentUserIndex !== -1 ? currentUserIndex + 1 : 12,
      name: currentUserObj?.name || "Ziggemma",
      points: currentUserObj?.aetherPoints || 0
    };

    res.json({
      leaderboard,
      currentUser
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
