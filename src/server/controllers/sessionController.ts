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

export const createSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const session = new StudySession({
      userId,
      ...req.body
    });
    await session.save();

    // Update user stats
    const duration = req.body.durationMinutes || 0;
    if (duration > 0 && req.body.type === 'study') {
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          totalStudyTime: duration,
          aetherPoints: duration * 10
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

    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );

    // Update user stats if duration or completion changed
    if (session && req.body.durationMinutes !== undefined && originalSession.type === 'study') {
      const diff = (req.body.durationMinutes || 0) - (originalSession.durationMinutes || 0);
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
