import { Request, Response } from 'express';
import { QuizResult } from '../models/QuizResult.js';

export const getResults = async (req: Request, res: Response) => {
  try {
    const results = await QuizResult.find({ userId: (req as any).userId });
    
    // Sort natively to bypass Mongo memory ceilings on large objects
    results.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createResult = async (req: Request, res: Response) => {
  try {
    const result = new QuizResult({
      userId: (req as any).userId,
      ...req.body
    });
    await result.save();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
