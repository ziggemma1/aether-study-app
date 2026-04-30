import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'General' },
  startTime: { type: Date, default: Date.now },
  durationMinutes: { type: Number, default: 0 },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'in-progress'], default: 'completed' },
  goals: [{ type: String }],
}, { timestamps: true });

export const StudySession = mongoose.model('StudySession', studySessionSchema);
