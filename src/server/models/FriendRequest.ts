import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: String, required: true }, // Keeping as string to match User ID type if needed, but usually ObjectId is better
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });

export const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
