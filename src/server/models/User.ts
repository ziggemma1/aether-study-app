import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  streakTrend: { type: Number, default: 0 },
  curriculum: { type: String, default: 'General' },
  language: { type: String, default: 'English' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  handle: { type: String, unique: true, sparse: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  avgQuizScore: { type: Number, default: 0 },
  highestQuizScore: { type: Number, default: 0 },
  lowestQuizScore: { type: Number, default: 0 },
  quizTrend: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  timeTrend: { type: Number, default: 0 },
  globalRank: { type: Number, default: 0 },
  rankTrend: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  friendsCount: { type: Number, default: 0 },
  following: [{ type: String }],
  followers: [{ type: String }],
  achievements: [{
    id: String,
    title: String,
    description: String,
    icon: String,
    category: String,
    target: Number,
    currentProgress: Number,
    isUnlocked: Boolean,
    unlockedAt: String
  }],
  weeklyTimeData: [{ 
    day: { type: String },
    hours: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(this: any) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
