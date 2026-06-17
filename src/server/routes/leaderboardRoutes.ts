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
      id: u._id.toString(),
      avatar: u.avatar || null,
      subject: (u as any).subject || 'All Subjects',
      points: {
        total: u.aetherPoints || 0,
        studyTime: Math.floor((u.aetherPoints || 0) * 0.4), // Derived points
        quizzes: Math.floor((u.aetherPoints || 0) * 0.5),
        streak: Math.floor((u.aetherPoints || 0) * 0.1),
      }
    }));

    const leaderboard = mappedUsers.slice(0, limitNum);

    // Find current user's profile and dynamic rank
    const currentUserIndex = mappedUsers.findIndex(u => u.id === userId.toString());
    
    res.json({
      leaderboard,
      totalUsers: mappedUsers.length,
      currentUserRank: currentUserIndex !== -1 ? currentUserIndex + 1 : null,
      topScore: mappedUsers[0]?.points.total || 0,
      weekEnding: '4d 12h' // Could be dynamic
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
