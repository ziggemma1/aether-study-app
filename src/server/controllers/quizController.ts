import { Request, Response } from 'express';
import { QuizResult } from '../models/QuizResult.js';
import { User } from '../models/User.js';
import { checkAchievements } from '../services/achievement-service.js';

export const getResults = async (req: Request, res: Response) => {
  try {
    const results = await QuizResult.find({ userId: (req as any).userId }).sort({ createdAt: -1 });
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Hard ceiling on a single quiz's question count — guards against point-farming
// via absurd totalQuestions/score values, independent of any client-side limit.
const MAX_QUIZ_QUESTIONS = 200;

export const createResult = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { quizId, answers } = req.body;

    const totalQuestions = Math.min(
      MAX_QUIZ_QUESTIONS,
      Math.max(1, Math.floor(Number(req.body.totalQuestions)) || 0)
    );
    if (!totalQuestions) {
      return res.status(400).json({ message: 'totalQuestions must be a positive number' });
    }

    // Score can never exceed the number of questions in the quiz.
    const score = Math.min(totalQuestions, Math.max(0, Math.floor(Number(req.body.score)) || 0));

    const result = new QuizResult({
      userId,
      quizId,
      score,
      totalQuestions,
      answers: Array.isArray(answers) ? answers : []
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
          aetherPoints: score * 10
        }
      });
    }

    const newlyUnlockedAchievements = await checkAchievements(userId);

    // aetherPoints changes both from the score increment above and from any
    // achievement bonus checkAchievements just applied — read back the final
    // value so the client can update its cached user without a full refetch.
    const updatedUser = await User.findById(userId).select('aetherPoints streak');

    res.status(201).json({
      ...result.toObject(),
      aetherPoints: updatedUser?.aetherPoints,
      streak: updatedUser?.streak,
      newlyUnlockedAchievements
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
