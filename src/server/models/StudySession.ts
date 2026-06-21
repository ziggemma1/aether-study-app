import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  type: { type: String, enum: ['study', 'break', 'review'], default: 'study' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

studySessionSchema.index({ userId: 1, startTime: 1 });

export const StudySession = mongoose.model('StudySession', studySessionSchema);
