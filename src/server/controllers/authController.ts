import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email: normalizedEmail, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        longestStreak: user.longestStreak,
        globalRank: user.globalRank,
        avgQuizScore: user.avgQuizScore,
        totalStudyTime: user.totalStudyTime,
        weeklyTimeData: user.weeklyTimeData,
        plan: user.plan,
        points: user.points || 0,
        followersCount: user.followersCount || 0,
        friendsCount: user.friendsCount || 0,
        achievements: user.achievements || [],
        bio: user.bio || '',
        location: user.location || '',
        handle: user.handle || ''
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    console.log(`Login attempt for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        longestStreak: user.longestStreak,
        globalRank: user.globalRank,
        avgQuizScore: user.avgQuizScore,
        totalStudyTime: user.totalStudyTime,
        weeklyTimeData: user.weeklyTimeData,
        plan: user.plan,
        points: user.points || 0,
        followersCount: user.followersCount || 0,
        friendsCount: user.friendsCount || 0,
        achievements: user.achievements || [],
        bio: user.bio || '',
        location: user.location || '',
        handle: user.handle || ''
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Transform to consistent frontend structure
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      streak: user.streak,
      longestStreak: user.longestStreak,
      globalRank: user.globalRank,
      avgQuizScore: user.avgQuizScore,
      highestQuizScore: user.highestQuizScore,
      lowestQuizScore: user.lowestQuizScore,
      totalStudyTime: user.totalStudyTime,
      weeklyTimeData: user.weeklyTimeData,
      curriculum: user.curriculum,
      language: user.language,
      plan: user.plan,
      points: user.points || 0,
      followersCount: user.followersCount || 0,
      friendsCount: user.friendsCount || 0,
      achievements: user.achievements || [],
      bio: user.bio || '',
      location: user.location || '',
      handle: user.handle || ''
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
