import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL ERROR: JWT_SECRET environment variable is not set. Throwing error to prevent fallback vulnerabilities.");
    throw new Error('JWT_SECRET is not defined');
  }
  return secret;
};

export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = baseUrl.replace(/\/$/, '') + '/api/auth/google-callback';
  
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  });
  res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('No code provided');
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = baseUrl.replace(/\/$/, '') + '/api/auth/google-callback';
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
    const { tokens } = await client.getToken(code as string);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('No user payload found in Google token');
    }

    const { email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase();
    
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const crypto = await import('crypto');
      user = new User({
        name: name || payload.given_name || 'Student',
        email: normalizedEmail,
        password: crypto.randomBytes(32).toString('hex'), // cryptographically secure random password
        avatar: picture,
        country: '',
        language: 'English (US)'
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: '7d' });
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('/dashboard');
  } catch (error: any) {
    console.error('Google callback error:', error);
    res.status(500).send('Authentication failed');
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, country, language } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ 
      name, 
      email: normalizedEmail, 
      password,
      country: country || '',
      language: language || 'English (US)'
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: '7d' });
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
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
        following: user.following || [],
        achievements: user.achievements || [],
        bio: user.bio || '',
        location: user.location || '',
        handle: user.handle || '',
        country: user.country || '',
        language: user.language || 'English (US)'
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

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: '7d' });
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
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
        following: user.following || [],
        achievements: user.achievements || [],
        bio: user.bio || '',
        location: user.location || '',
        handle: user.handle || '',
        country: user.country || '',
        language: user.language || 'English (US)'
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
      country: user.country || '',
      plan: user.plan,
      points: user.points || 0,
      followersCount: user.followersCount || 0,
      friendsCount: user.friendsCount || 0,
      following: user.following || [],
      achievements: user.achievements || [],
      bio: user.bio || '',
      location: user.location || '',
      handle: user.handle || ''
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
