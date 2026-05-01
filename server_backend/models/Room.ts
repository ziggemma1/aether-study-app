import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['study', 'hangout'], default: 'study' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
