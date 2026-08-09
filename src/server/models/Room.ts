import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topic: { type: String, default: 'General' },
  activeCount: { type: Number, default: 0 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  /** See User.isDemoData — same seed/teardown marker, same rules. */
  isDemoData: { type: Boolean, default: false }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
