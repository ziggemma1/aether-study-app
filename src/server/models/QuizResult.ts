import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  timeSpent: { type: Number, default: 0 },
  difficulty: { type: String, default: 'Medium' },
  topic: { type: String, default: 'General' },
}, { timestamps: true });

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
