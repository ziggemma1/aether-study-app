import { Request, Response } from 'express';
import { StudySession } from '../models/StudySession.js';
import { User } from '../models/User.js';

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await StudySession.find({ userId: (req as any).userId });
    
    // Sort natively to bypass Mongo memory ceilings
    sessions.sort((a: any, b: any) => {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return dateA - dateB; // Sort ascending 1
    });

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

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const session = await StudySession.findOneAndDelete({ 
      _id: req.params.id, 
      userId: (req as any).userId 
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
