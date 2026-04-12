import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: String },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [{ type: Number }],
  createdAt: { type: Date, default: Date.now }
});

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
