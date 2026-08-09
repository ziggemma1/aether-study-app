import { Request, Response } from 'express';
import { StudySession } from '../models/StudySession.js';
import { User } from '../models/User.js';
import { checkAchievements } from '../services/achievement-service.js';
import { touchStreak } from '../services/streak-service.js';

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await StudySession.find({ userId: (req as any).userId }).sort({ startTime: 1 });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Hard ceiling on a single session's duration — guards against point-farming
// via absurd durationMinutes values, independent of any client-side limit.
const MAX_SESSION_MINUTES = 1440; // 24 hours

const clampDuration = (value: any) => Math.min(MAX_SESSION_MINUTES, Math.max(0, Math.floor(Number(value)) || 0));

export const createSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, startTime, type, priority, completed } = req.body;
    const durationMinutes = clampDuration(req.body.durationMinutes);

    const session = new StudySession({
      userId,
      title,
      startTime,
      durationMinutes,
      type,
      priority,
      completed
    });
    await session.save();

    // Update user stats. `completed` defaults to false on the schema — a
    // scheduled/future block (Study Planner, Onboarding's "later" choice)
    // must not award points or advance the streak before it has actually
    // happened. `!== false` rather than `=== true` so callers that omit the
    // field entirely (there are none left, but nothing enforces that) keep
    // the pre-existing "award immediately" behavior instead of silently
    // losing credit.
    let streakResult = null;
    if (durationMinutes > 0 && type === 'study' && completed !== false) {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalStudyTime: durationMinutes,
          aetherPoints: durationMinutes * 10
        }
      });
      // Advance the daily streak. Must run before checkAchievements, since five
      // of the achievements are keyed on streak length and would otherwise be
      // evaluated against yesterday's value.
      streakResult = await touchStreak(userId);
    }

    // Update achievements on the and send response
    const newlyUnlockedAchievements = await checkAchievements(userId);
    const updatedUser = await User.findById(userId).select('aetherPoints streak totalStudyTime freezeTokens');

    res.status(201).json({
      ...session.toObject(),
      aetherPoints: updatedUser?.aetherPoints,
      streak: updatedUser?.streak,
      totalStudyTime: updatedUser?.totalStudyTime,
      freezeTokens: updatedUser?.freezeTokens,
      // Lets the client tell the user a token was spent on their behalf.
      freezeUsed: streakResult?.freezeUsed || false,
      streakBroken: streakResult?.streakBroken || false,
      newlyUnlockedAchievements
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get original session to calculate difference if duration changed
    const originalSession = await StudySession.findOne({ _id: req.params.id, userId });
    if (!originalSession) return res.status(404).json({ message: 'Session not found' });

    // Whitelist updatable fields — never let the client overwrite `userId` or
    // other server-owned fields via a spread of req.body.
    const { title, startTime, type, priority, completed } = req.body;
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (startTime !== undefined) updates.startTime = startTime;
    if (type !== undefined) updates.type = type;
    if (priority !== undefined) updates.priority = priority;
    if (completed !== undefined) updates.completed = completed;

    let durationMinutes: number | undefined;
    if (req.body.durationMinutes !== undefined) {
      durationMinutes = clampDuration(req.body.durationMinutes);
      updates.durationMinutes = durationMinutes;
    }

    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId },
      updates,
      { new: true }
    );

    let streakResult = null;

    if (session && originalSession.type === 'study') {
      const wasCompleted = originalSession.completed === true;
      const nowCompleted = completed !== undefined ? completed === true : wasCompleted;
      const effectiveDuration = durationMinutes !== undefined ? durationMinutes : (originalSession.durationMinutes || 0);

      if (!wasCompleted && nowCompleted) {
        // A scheduled/incomplete block just got checked off — this is its
        // first time being credited, same as a session created already-done.
        if (effectiveDuration > 0) {
          await User.findByIdAndUpdate(userId, {
            $inc: { totalStudyTime: effectiveDuration, aetherPoints: effectiveDuration * 10 }
          });
          streakResult = await touchStreak(userId);
        }
      } else if (wasCompleted && !nowCompleted) {
        // Un-checked after being credited — claw back what it added. The
        // streak itself is left alone: nothing anywhere decrements it once
        // advanced, and unwinding one from a single unchecked box risks
        // taking a whole chain down with it for a much smaller mistake.
        if ((originalSession.durationMinutes || 0) > 0) {
          await User.findByIdAndUpdate(userId, {
            $inc: {
              totalStudyTime: -(originalSession.durationMinutes || 0),
              aetherPoints: -(originalSession.durationMinutes || 0) * 10
            }
          });
        }
      } else if (wasCompleted && nowCompleted && durationMinutes !== undefined) {
        // Already credited before this call; only the duration changed —
        // true up the difference (original behavior).
        const diff = durationMinutes - (originalSession.durationMinutes || 0);
        if (diff !== 0) {
          await User.findByIdAndUpdate(userId, {
            $inc: { totalStudyTime: diff, aetherPoints: diff * 10 }
          });
        }
      }
    }

    const newlyUnlockedAchievements = await checkAchievements(userId);
    const updatedUser = await User.findById(userId).select('aetherPoints streak totalStudyTime freezeTokens');

    res.json({
      ...(session?.toObject() || {}),
      aetherPoints: updatedUser?.aetherPoints,
      streak: updatedUser?.streak,
      totalStudyTime: updatedUser?.totalStudyTime,
      freezeTokens: updatedUser?.freezeTokens,
      freezeUsed: streakResult?.freezeUsed || false,
      streakBroken: streakResult?.streakBroken || false,
      newlyUnlockedAchievements
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const session = await StudySession.findOneAndDelete({ 
      _id: req.params.id, 
      userId: userId 
    });
    
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Revert user stats — but only if this session was ever credited.
    // Scheduled/incomplete study blocks (completed: false) never added
    // anything in the first place now, so deleting one must not subtract.
    if (session.type === 'study' && session.durationMinutes > 0 && session.completed === true) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          totalStudyTime: -session.durationMinutes,
          aetherPoints: -(session.durationMinutes * 10)
        }
      });
    }

    res.json({ message: 'Session deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
