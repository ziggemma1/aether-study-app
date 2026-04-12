import { Request, Response } from 'express';
import { QuizResult } from '../models/QuizResult';

export const getResults = async (req: Request, res: Response) => {
  try {
    const results = await QuizResult.find({ userId: (req as any).userId }).sort({ createdAt: -1 });
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
