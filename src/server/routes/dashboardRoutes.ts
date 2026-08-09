import express from 'express';
import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { QuizResult } from '../models/QuizResult.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate leaderboard rank and total learners dynamically using fast index counts
    const totalLearners = await User.countDocuments({ optedInLeaderboard: { $ne: false } });
    // Opted-out users have no rank. This used to leave the initial `rank = 1`
    // in place, so opting out of the leaderboard promoted you to first place.
    let rank: number | null = null;
    if (user.optedInLeaderboard !== false) {
      rank = await User.countDocuments({
        optedInLeaderboard: { $ne: false },
        aetherPoints: { $gt: user.aetherPoints || 0 }
      }) + 1;
    }

    // Both of these used to be read straight off the user document, and both
    // were wrong there:
    //  - `avgQuizScore` was written as a raw number of correct answers, so the
    //    dashboard rendered "2%" for someone averaging 2 of 3. Fixed at the
    //    write site in quizController, but stored values stay stale until the
    //    next quiz — computing here means every account is right immediately.
    //  - `totalStudyTime` is a counter that only `createSession` increments,
    //    and only for `type === 'study'`, so it drifts below the sessions
    //    actually logged. The session records are the evidence.
    const [quizzes, timeAgg] = await Promise.all([
      QuizResult.find({ userId }).select('score totalQuestions'),
      StudySession.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, minutes: { $sum: '$durationMinutes' } } }
      ])
    ]);

    const scored = quizzes.filter((q: any) => q.totalQuestions > 0);
    const averageQuizScore = scored.length
      ? Math.round(scored.reduce((sum: number, q: any) => sum + (q.score / q.totalQuestions) * 100, 0) / scored.length)
      : 0;

    const loggedMinutes = timeAgg[0]?.minutes || 0;

    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      image: user.avatar || null,
      joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      streak: user.streak || 0,
      // The streak hero shows this as "your best is N days" — the stake the
      // user is playing against when a streak is at risk.
      longestStreak: user.longestStreak || 0,
      totalStudyTime: loggedMinutes || user.totalStudyTime || 0, // In minutes
      averageQuizScore,
      quizCount: scored.length,
      rank: rank,
      totalLearners: totalLearners
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/study-stats', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the study sessions of the current week (Sunday to Saturday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const checkDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dbSessions = await StudySession.find({
      userId,
      startTime: { $gte: startOfWeek }
    });

    const dailyMinutes = new Map<string, number>();
    checkDays.forEach(day => dailyMinutes.set(day.toUpperCase(), 0));

    dbSessions.forEach(session => {
      if (session.startTime) {
        const date = new Date(session.startTime);
        const dayLabel = checkDays[date.getDay()].toUpperCase();
        const duration = session.durationMinutes || 0;
        dailyMinutes.set(dayLabel, (dailyMinutes.get(dayLabel) || 0) + duration);
      }
    });

    // Format output
    const weeklyData = checkDays.map(day => {
      const uday = day.toUpperCase();
      return {
        day: uday,
        minutes: Math.round(dailyMinutes.get(uday) || 0)
      };
    });

    const activeMinutes = weeklyData.map(d => d.minutes);
    const peak = activeMinutes.length > 0 ? Math.max(...activeMinutes) : 0;
    const floor = activeMinutes.length > 0 ? Math.min(...activeMinutes) : 0;
    const sum = activeMinutes.reduce((acc, curr) => acc + curr, 0);
    const average = activeMinutes.length > 0 ? parseFloat((sum / activeMinutes.length).toFixed(1)) : 0;

    res.json({
      weeklyData,
      peak,
      floor,
      average
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
