import express from 'express';
import { User } from '../models/User.js';
import { StudySession } from '../models/StudySession.js';
import { QuizResult } from '../models/QuizResult.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * Monday 00:00 UTC of the week `date` falls in.
 *
 * The board used to report a flat `weekEnding: '4d 12h'` to every user on every
 * request, so "Resets in" counted down to nothing and never changed. The weekly
 * range below is a real window with a real boundary.
 */
function startOfWeekUTC(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

type Totals = { minutes: number; sessions: number; quizzes: number; quizScore: number };

/** Roll study sessions and quiz results up per user, optionally since a date. */
async function activityByUser(userIds: any[], since?: Date) {
  const match: any = { userId: { $in: userIds } };
  if (since) match.createdAt = { $gte: since };

  const [sessions, quizzes] = await Promise.all([
    StudySession.aggregate([
      { $match: match },
      { $group: { _id: '$userId', minutes: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } }
    ]),
    QuizResult.aggregate([
      { $match: match },
      { $group: { _id: '$userId', quizzes: { $sum: 1 }, quizScore: { $sum: '$score' } } }
    ])
  ]);

  const totals = new Map<string, Totals>();
  const bucket = (id: string) => {
    if (!totals.has(id)) totals.set(id, { minutes: 0, sessions: 0, quizzes: 0, quizScore: 0 });
    return totals.get(id)!;
  };

  for (const row of sessions) {
    const t = bucket(row._id.toString());
    t.minutes = row.minutes || 0;
    t.sessions = row.sessions || 0;
  }
  for (const row of quizzes) {
    const t = bucket(row._id.toString());
    t.quizzes = row.quizzes || 0;
    t.quizScore = row.quizScore || 0;
  }
  return totals;
}

/**
 * GET /api/leaderboard/top?limit=10&range=all|week
 *
 * Every number here is measured. The previous version derived a user's
 * "study time", "quizzes" and "streak" from their point total by multiplying it
 * by 0.4, 0.5 and 0.1 — three stats that were really one number wearing three
 * hats, and none of them true.
 */
router.get('/top', async (req, res) => {
  try {
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const range = req.query.range === 'week' ? 'week' : 'all';
    const userId = (req as any).userId?.toString();

    const users = await User.find({ optedInLeaderboard: { $ne: false } })
      .select('name avatar handle streak totalStudyTime aetherPoints');

    const ids = users.map((u: any) => u._id);
    const now = new Date();
    const periodStart = range === 'week' ? startOfWeekUTC(now) : undefined;
    const activity = await activityByUser(ids, periodStart);

    // Weekly points are reconstructed with the same rates the app awards at:
    // sessionController gives durationMinutes * 10, quizController gives
    // score * 10. All-time simply reads the stored counter.
    const ranked = users
      .map((u: any) => {
        const id = u._id.toString();
        const t = activity.get(id) || { minutes: 0, sessions: 0, quizzes: 0, quizScore: 0 };
        const points = range === 'week'
          ? t.minutes * 10 + t.quizScore * 10
          : (u.aetherPoints || 0);

        return {
          id,
          name: u.name,
          avatar: u.avatar || null,
          handle: u.handle || null,
          points,
          streak: u.streak || 0,
          // All-time uses the running total on the profile; the weekly view
          // reports only what was actually logged inside the window.
          studyMinutes: range === 'week' ? t.minutes : (u.totalStudyTime || 0),
          quizzes: t.quizzes,
          sessions: t.sessions
        };
      })
      // A weekly board with everyone who has never studied listed at 0 points is
      // not a ranking, so the week only ranks people who did something in it.
      .filter((u) => (range === 'week' ? u.points > 0 : true))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((u, idx) => ({ ...u, rank: idx + 1 }));

    const me = ranked.find((u) => u.id === userId) || null;

    res.json({
      range,
      periodStart: periodStart ? periodStart.toISOString() : null,
      // Real boundary for the countdown, rather than a string constant.
      resetsAt: periodStart ? addDaysUTC(periodStart, 7).toISOString() : null,
      leaderboard: ranked.slice(0, limitNum),
      totalUsers: ranked.length,
      topScore: ranked[0]?.points || 0,
      // Sent separately so the page can pin your row when you rank below the
      // slice being shown — previously you simply vanished off the board.
      currentUser: me
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
