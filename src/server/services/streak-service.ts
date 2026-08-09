import { User } from '../models/User.js';

/**
 * Daily study streak.
 *
 * Nothing in the codebase ever wrote `user.streak` — it was read by the
 * dashboard, the profile, the library stats, the leaderboard and five
 * achievements, and set by nobody, so it sat at 0 forever. That also made the
 * shop's 100-point "Streak Freeze" protect something that could not break.
 *
 * Called whenever a user does something that counts as studying: finishing a
 * session or completing a quiz.
 */

/** Midnight UTC for a date, so "same day" does not drift with the clock. */
function dayStart(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

const DAY_MS = 86_400_000;

export interface StreakResult {
  streak: number;
  longestStreak: number;
  freezeTokens: number;
  /** True when a freeze token was spent to bridge a missed day. */
  freezeUsed: boolean;
  /** True when the streak reset because the gap was too wide to bridge. */
  streakBroken: boolean;
}

/**
 * Never throws. Both callers run this AFTER the session/quiz row is already
 * saved, so letting it reject would turn a successful write into a 500 and the
 * client would report a lost session that is in fact recorded.
 */
export async function touchStreak(userId: string): Promise<StreakResult | null> {
  try {
    return await updateStreak(userId);
  } catch (err: any) {
    console.error('[Streak] Failed to update streak:', err?.message);
    return null;
  }
}

async function updateStreak(userId: string): Promise<StreakResult | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const today = dayStart(now);
  const last = user.lastActiveDate ? dayStart(new Date(user.lastActiveDate)) : null;

  let freezeUsed = false;
  let streakBroken = false;

  if (last === null) {
    user.streak = 1;
  } else {
    const gapDays = Math.round((today - last) / DAY_MS);

    if (gapDays <= 0) {
      // Already counted today. Studying twice in a day is not two days.
      return {
        streak: user.streak || 0,
        longestStreak: user.longestStreak || 0,
        freezeTokens: user.freezeTokens || 0,
        freezeUsed: false,
        streakBroken: false
      };
    }

    if (gapDays === 1) {
      user.streak = (user.streak || 0) + 1;
    } else {
      // One token bridges one missed day. A longer absence resets, rather than
      // draining every token the user owns for a gap they cannot recover.
      const missed = gapDays - 1;
      if (missed === 1 && (user.freezeTokens || 0) > 0) {
        user.freezeTokens -= 1;
        user.streak = (user.streak || 0) + 1;
        freezeUsed = true;
      } else {
        user.streak = 1;
        streakBroken = true;
      }
      user.lastStreakResetDate = now;
    }
  }

  if ((user.streak || 0) > (user.longestStreak || 0)) {
    user.longestStreak = user.streak;
  }
  user.lastActiveDate = now;
  await user.save();

  return {
    streak: user.streak,
    longestStreak: user.longestStreak,
    freezeTokens: user.freezeTokens || 0,
    freezeUsed,
    streakBroken
  };
}
