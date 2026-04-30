import { Request, Response } from 'express';
import { StudySession } from '../models/StudySession.js';

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
    const { 
      title, 
      type, 
      startTime, 
      durationMinutes, 
      materialId, 
      notes, 
      status, 
      goals 
    } = req.body;

    const session = new StudySession({
      userId: (req as any).userId,
      title,
      type,
      startTime: startTime || new Date(),
      durationMinutes,
      materialId,
      notes,
      status: status || 'completed',
      goals: goals || []
    });
    await session.save();
    res.status(201).json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSession = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      notes, 
      durationMinutes, 
      status, 
      goals 
    } = req.body;

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (notes !== undefined) updateFields.notes = notes;
    if (durationMinutes !== undefined) updateFields.durationMinutes = durationMinutes;
    if (status !== undefined) updateFields.status = status;
    if (goals !== undefined) updateFields.goals = goals;

    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).userId },
      { $set: updateFields },
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
