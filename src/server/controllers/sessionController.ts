import { Request, Response } from 'express';
import { StudySession } from '../models/StudySession.js';
import { User } from '../models/User.js';
import { checkAchievements } from '../services/achievement-service.js';

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

    // Update user stats
    if (durationMinutes > 0 && type === 'study') {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalStudyTime: durationMinutes,
          aetherPoints: durationMinutes * 10
        }
      });
    }

    // Update achievements on the and send response
    await checkAchievements(userId);

    res.status(201).json(session);
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

    // Update user stats if duration or completion changed
    if (session && durationMinutes !== undefined && originalSession.type === 'study') {
      const diff = durationMinutes - (originalSession.durationMinutes || 0);
      if (diff !== 0) {
        await User.findByIdAndUpdate(userId, {
          $inc: {
            totalStudyTime: diff,
            aetherPoints: diff * 10
          }
        });
      }
    }

    await checkAchievements(userId);

    res.json(session);
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

    // Revert user stats if it was a study session
    if (session.type === 'study' && session.durationMinutes > 0) {
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
