import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'youtube', 'article', 'audio', 'unified', 'image', 'video', 'note'], required: true },
  summary: { type: String },
  content: { type: String },
  keyTopics: [{ type: String }],
  realLifeApplications: [{ type: String }],
  suggestedQuizQuestions: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  }],
  progress: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Material = mongoose.model('Material', materialSchema);
