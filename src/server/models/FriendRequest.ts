import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  senderId: { type: String, required: true, ref: 'User' },
  receiverId: { type: String, required: true, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Avoid duplicate requests
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
