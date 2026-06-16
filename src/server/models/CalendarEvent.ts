import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  type: { type: String, enum: ['study', 'deadline', 'personal', 'exam'], default: 'study' },
  subject: { type: String },
  color: { type: String },
  googleEventId: { type: String },
  synced: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
