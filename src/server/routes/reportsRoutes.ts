import express from 'express';
import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { QuizResult } from '../models/QuizResult.js';
import { Material } from '../models/Material.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// 1. Summary Endpoint
router.get('/summary', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate real study sessions sum
    const sessions = await StudySession.find({ userId, type: 'study' });
    const totalStudyTimeMinutes = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) || user.totalStudyTime || 0;

    // Calculate dynamic average quiz score percentage
    const quizResults = await QuizResult.find({ userId });
    let averageQuizScore = 0;
    if (quizResults.length > 0) {
      const totalPercentage = quizResults.reduce((acc, curr) => {
        const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
        return acc + p;
      }, 0);
      averageQuizScore = Math.round((totalPercentage / quizResults.length) * 10) / 10;
    } else {
      averageQuizScore = user.avgQuizScore || 0;
    }

    // Dynamic leaderboard rank
    const allUsers = await User.find({ optedInLeaderboard: { $ne: false } }).sort({ aetherPoints: -1 }).select('_id');
    const totalLearners = allUsers.length || 1;
    const rankIndex = allUsers.findIndex(u => u._id.toString() === userId.toString());
    const globalRank = rankIndex !== -1 ? rankIndex + 1 : (user.globalRank || 12);

    res.json({
      totalStudyTimeMinutes,
      averageQuizScore,
      globalRank,
      totalLearners,
      studyStreak: user.streak || 0,
      weeklyChange: {
        studyTime: user.timeTrend || 12,
        quizScore: user.quizTrend || 4.2
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Trends Endpoint
router.get('/trends', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const period = req.query.period as string || 'week';
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessions = await StudySession.find({ userId, type: 'study' });
    const results = await QuizResult.find({ userId });

    const labels: string[] = [];
    const scores: number[] = [];
    const studyMinutes: number[] = [];

    const today = new Date();

    if (period === 'week') {
      // Last 7 days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(label);

        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        // Sessions study minutes in this day
        const daySessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= startOfDay && new Date(s.startTime) <= endOfDay);
        studyMinutes.push(daySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        // Quiz scores in this day
        const dayQuizzes = results.filter(r => r.createdAt && new Date(r.createdAt) >= startOfDay && new Date(r.createdAt) <= endOfDay);
        if (dayQuizzes.length > 0) {
          const avg = dayQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / dayQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          scores.push(user.avgQuizScore || 70);
        }
      }
    } else if (period === 'month') {
      // Last 4 weeks ending today
      for (let i = 3; i >= 0; i--) {
        const startDay = new Date(today);
        startDay.setDate(today.getDate() - (i + 1) * 7);
        const endDay = new Date(today);
        endDay.setDate(today.getDate() - i * 7);

        const label = `${startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDay.toLocaleDateString('en-US', { day: 'numeric' })}`;
        labels.push(label);

        const rangeSessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= startDay && new Date(s.startTime) <= endDay);
        studyMinutes.push(rangeSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        const rangeQuizzes = results.filter(r => r.createdAt && new Date(r.createdAt) >= startDay && new Date(r.createdAt) <= endDay);
        if (rangeQuizzes.length > 0) {
          const avg = rangeQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / rangeQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          scores.push(user.avgQuizScore || 70);
        }
      }
    } else {
      // 'all' - Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        labels.push(label);

        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthSessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= startOfMonth && new Date(s.startTime) <= endOfMonth);
        studyMinutes.push(monthSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        const monthQuizzes = results.filter(r => r.createdAt && new Date(r.createdAt) >= startOfMonth && new Date(r.createdAt) <= endOfMonth);
        if (monthQuizzes.length > 0) {
          const avg = monthQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / monthQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          scores.push(user.avgQuizScore || 75);
        }
      }
    }

    res.json({
      labels,
      scores,
      studyMinutes
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Subject Proficiency Endpoint
router.get('/subject-proficiency', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const materials = await Material.find({ userId });
    const quizResults = await QuizResult.find({ userId });

    const defaultSubjects = ["Mathematics", "Science", "History"];
    const subjectMap = new Map<string, { totalScorePercent: number; count: number; quizCount: number }>();

    defaultSubjects.forEach(sub => {
      subjectMap.set(sub, { totalScorePercent: 0, count: 0, quizCount: 0 });
    });

    materials.forEach(mat => {
      const category = mat.category || "General";
      if (!subjectMap.has(category)) {
        subjectMap.set(category, { totalScorePercent: 0, count: 0, quizCount: 0 });
      }
    });

    for (const mat of materials) {
      const category = mat.category || "General";
      const matQuizzes = quizResults.filter(q => q.quizId === mat._id.toString() || q.quizId === mat.id);

      if (matQuizzes.length > 0) {
        const totalPercentage = matQuizzes.reduce((acc, q) => {
          const percentage = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
          return acc + percentage;
        }, 0);

        const entry = subjectMap.get(category)!;
        entry.totalScorePercent += totalPercentage;
        entry.quizCount += matQuizzes.length;
        subjectMap.set(category, entry);
      }
    }

    const subjects = Array.from(subjectMap.entries()).map(([name, data]) => {
      const proficiency = data.quizCount > 0 ? Math.round(data.totalScorePercent / data.quizCount) : 0;
      return {
        name,
        proficiency,
        quizCount: data.quizCount
      };
    });

    res.json({ subjects });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
