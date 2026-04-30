import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  country: { type: String, default: '' },
  language: { type: String, default: 'English (US)' },
  curriculum: { type: String, default: 'General' },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  globalRank: { type: Number, default: 0 },
  avgQuizScore: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  weeklyTimeData: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
  plan: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
  points: { type: Number, default: 0 },
  aetherPoints: { type: Number, default: 0 },
  freezeTokens: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  friendsCount: { type: Number, default: 0 },
  following: [{ type: String }],
  followers: [{ type: String }],
  achievements: [{ type: String }],
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  handle: { type: String, unique: true, sparse: true },
  optedInLeaderboard: { type: Boolean, default: true },
  themeUnlocked: [{ type: String, default: ['Light', 'Dark'] }],
  highestQuizScore: { type: Number, default: 0 },
  lowestQuizScore: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
