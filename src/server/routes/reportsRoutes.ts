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

    // Dynamic leaderboard rank. A user who is not in the ranked set (opted out,
    // or not yet counted) has no rank — say so with null rather than falling
    // back to a stock "#12" that the leaderboard itself would contradict.
    const allUsers = await User.find({ optedInLeaderboard: { $ne: false } }).sort({ aetherPoints: -1 }).select('_id');
    const totalLearners = allUsers.length;
    const rankIndex = allUsers.findIndex(u => u._id.toString() === userId.toString());
    const globalRank = rankIndex !== -1 ? rankIndex + 1 : null;

    res.json({
      totalStudyTimeMinutes,
      averageQuizScore,
      globalRank,
      totalLearners,
      studyStreak: user.streak || 0,
      // These default to 0 on the model. `|| 12` / `|| 4.2` turned "no movement
      // yet" into an invented double-digit gain on every new account.
      weeklyChange: {
        studyTime: user.timeTrend ?? 0,
        quizScore: user.quizTrend ?? 0
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

    // Fetch all user sessions (study or review) and quiz results
    const sessions = await StudySession.find({ userId });
    const results = await QuizResult.find({ userId });

    const labels: string[] = [];
    const scores: number[] = [];
    const studyMinutes: number[] = [];

    const today = new Date();

    // Timezone-robust short-date string matching helper (YYYY-MM-DD)
    const getLocalDateString = (dateInput: any) => {
      if (!dateInput) return '';
      const date = new Date(dateInput);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getLocalMonthString = (dateInput: any) => {
      if (!dateInput) return '';
      const date = new Date(dateInput);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    if (period === 'week') {
      // Last 7 days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(label);

        const targetDayStr = getLocalDateString(d);

        // Sessions study minutes in this day (checks matching calendar day)
        const daySessions = sessions.filter(s => s.startTime && getLocalDateString(s.startTime) === targetDayStr);
        studyMinutes.push(daySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        // Quiz scores in this day
        const dayQuizzes = results.filter(r => r.createdAt && getLocalDateString(r.createdAt) === targetDayStr);
        if (dayQuizzes.length > 0) {
          const avg = dayQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / dayQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          // Fall back gracefully to user average when no quizzes exist, or 0 if user is fresh
          scores.push(user.avgQuizScore || 0);
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

        const startOfDay = new Date(startDay);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(endDay);
        endOfDay.setHours(23, 59, 59, 999);

        const rangeSessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= startOfDay && new Date(s.startTime) <= endOfDay);
        studyMinutes.push(rangeSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        const rangeQuizzes = results.filter(r => r.createdAt && new Date(r.createdAt) >= startOfDay && new Date(r.createdAt) <= endOfDay);
        if (rangeQuizzes.length > 0) {
          const avg = rangeQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / rangeQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          scores.push(user.avgQuizScore || 0);
        }
      }
    } else {
      // 'all' - Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        labels.push(label);

        const targetMonthStr = getLocalMonthString(d);

        const monthSessions = sessions.filter(s => s.startTime && getLocalMonthString(s.startTime) === targetMonthStr);
        studyMinutes.push(monthSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

        const monthQuizzes = results.filter(r => r.createdAt && getLocalMonthString(r.createdAt) === targetMonthStr);
        if (monthQuizzes.length > 0) {
          const avg = monthQuizzes.reduce((acc, curr) => {
            const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
            return acc + p;
          }, 0) / monthQuizzes.length;
          scores.push(Math.round(avg));
        } else {
          scores.push(user.avgQuizScore || 0);
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
