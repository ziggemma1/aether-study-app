import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  duration: { type: Number, required: true }, // in seconds
  focusScore: { type: Number, default: 100 },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('StudySession', studySessionSchema);
