import { Request, Response } from 'express';
import { QuizResult } from '../models/QuizResult.js';
import { User } from '../models/User.js';
import { checkAchievements } from '../services/achievement-service.js';

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
    const userId = (req as any).userId;
    const result = new QuizResult({
      userId,
      ...req.body
    });
    await result.save();

    // Update user stats
    const results = await QuizResult.find({ userId });
    if (results.length > 0) {
      const totalScore = results.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avgScore = Math.round(totalScore / results.length);
      const highest = Math.max(...results.map(r => r.score || 0));
      const lowest = Math.min(...results.map(r => r.score || 0));

      await User.findByIdAndUpdate(userId, {
        $set: {
          avgQuizScore: avgScore,
          highestQuizScore: highest,
          lowestQuizScore: lowest
        },
        $inc: {
          aetherPoints: (req.body.score || 0) * 10
        }
      });
    }

    await checkAchievements(userId);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
