import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  streak: { type: Number, default: 0 },
  curriculum: { type: String, default: 'General' },
  language: { type: String, default: 'en' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
