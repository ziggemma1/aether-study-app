import { Request, Response } from 'express';
import { StudySession } from '../models/StudySession.js';

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
    const session = new StudySession({
      userId: (req as any).userId,
      ...req.body
    });
    await session.save();
    res.status(201).json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSession = async (req: Request, res: Response) => {
  try {
    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).userId },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
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
