import mongoose from 'mongoose';

const studyPlanDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date, required: true },
  topic: { type: String, required: true },
  activities: [{ type: String }],
  estimatedTime: { type: Number }, // in minutes
  completed: { type: Boolean, default: false }
});

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  goal: { type: String, required: true },
  complexity: { type: String, required: true },
  dailyCommitment: { type: Number, required: true }, // in minutes
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: [studyPlanDaySchema],
  totalHours: { type: Number, default: 0 },
  materialIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
  calendarSync: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studyPlanSchema.index({ userId: 1, createdAt: -1 });

export const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
