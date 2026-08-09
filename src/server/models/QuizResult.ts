import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: String },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [{ type: Number }],
  createdAt: { type: Date, default: Date.now },
  /** See User.isDemoData — same seed/teardown marker, same rules. */
  isDemoData: { type: Boolean, default: false }
});

quizResultSchema.index({ userId: 1, createdAt: -1 });

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
