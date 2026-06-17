import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("⚠️ WARNING: JWT_SECRET environment variable is not set. Using a temporary fallback secret for development.");
      return 'dev_temporary_secret_key_12345';
    }
    // In production/Vercel, we still log a CRITICAL error but provide a temporary fallback to prevent a total 500 crash
    // This allows the user to actually see the app and debug further.
    console.error("❌ CRITICAL ERROR: JWT_SECRET environment variable is not set! AUTH WILL BE INSECURE.");
    console.error("👉 ACTION REQUIRED: Set JWT_SECRET in your Vercel/Deployment environment variables.");
    return 'prod_emergency_fallback_secret_999'; 
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
    const normalizedEmail = email.trim().toLowerCase();
    
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = new User({
        name: name || payload.given_name || 'Student',
        email: normalizedEmail,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // random password
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
    console.error('[GOOGLE_CALLBACK_FATAL] Error occurred during Google callback:', error.message);
    res.status(500).json({ 
      message: 'Authentication failed due to an internal server error', 
      error: error.message || 'Unknown error'
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, country, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[REGISTER_DEBUG] Checking if user exists: "${normalizedEmail}" in readyState: ${mongoose.connection.readyState}`);
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`[REGISTER_DEBUG] Registration failed: User ${normalizedEmail} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log(`[REGISTER_DEBUG] Creating new user: ${normalizedEmail}`);
    const user = new User({ 
      name, 
      email: normalizedEmail, 
      password,
      country: country || '',
      language: language || 'English (US)'
    });
    await user.save();
    console.log(`[REGISTER_DEBUG] User saved with ID: ${user._id}. Signing JWT...`);

    const secret = getJwtSecret();
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    console.log(`[REGISTER_DEBUG] JWT signed. Setting cookie (isSecure: ${isSecure})...`);

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      token,
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
        aetherPoints: user.aetherPoints || 0,
        monthlyUploadCount: user.monthlyUploadCount || 0,
        lastUploadResetDate: user.lastUploadResetDate,
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
    
    const isAuthError = error.message?.includes('authentication failed');
    const isConnectionError = error.message?.includes('connection') || error.name === 'MongooseError';

    res.status(isAuthError || isConnectionError ? 503 : 500).json({ 
      errorId: 'AUTH_CONTROLLER_REGISTER_FATAL',
      message: isAuthError ? 'Database Authentication Failed' : 
               isConnectionError ? 'Database Connection Error' : 
               'Registration failed due to an internal server error', 
      error: error.message,
      hint: isAuthError ? 'Please check your MONGODB_URI credentials in Settings.' : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log(`[LOGIN_ENTRY] Request received at ${new Date().toISOString()}`);
  console.log(`[LOGIN] Received login request for: ${req.body?.email}`);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[LOGIN_DEBUG] Attempting DB lookup for: "${normalizedEmail}" in readyState: ${mongoose.connection.readyState}`);

    const user = await User.findOne({ email: normalizedEmail });
    console.log(`[LOGIN_DEBUG] User lookup completed. Found: ${!!user}`);
    if (!user) {
      console.log(`[LOGIN_DEBUG] Login failed: User "${normalizedEmail}" not found`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`[LOGIN_DEBUG] Verifying password for user: ${user._id}`);
    let isMatch = false;
    if (user && typeof (user as any).comparePassword === 'function') {
      isMatch = await (user as any).comparePassword(password);
    } else if (user && user.password) {
      console.warn('⚠️ comparePassword is not a function on User model instance. Falling back to direct bcrypt comparison.');
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      console.error('❌ User password field is missing or empty in database.');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (!isMatch) {
      console.log(`[LOGIN_DEBUG] Login failed: Password mismatch for ${normalizedEmail}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`[LOGIN_DEBUG] Password verified. Signing JWT...`);
    const secret = getJwtSecret();
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    console.log(`[LOGIN_DEBUG] JWT signed. Setting cookie (isSecure: ${isSecure})...`);

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
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
        aetherPoints: user.aetherPoints || 0,
        monthlyUploadCount: user.monthlyUploadCount || 0,
        lastUploadResetDate: user.lastUploadResetDate,
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
    console.error('[LOGIN_FATAL_ERROR_OBJECT]', error);
    
    // Detect specifically if it's a DB connection/auth error that escaped middleware or was buffered
    const isAuthError = error.message?.includes('authentication failed');
    const isConnectionError = error.message?.includes('connection') || error.name === 'MongooseError';
    
    const errorResponse = { 
      errorId: 'AUTH_CONTROLLER_LOGIN_FATAL',
      message: isAuthError ? 'Database Authentication Failed' : 
               isConnectionError ? 'Database Connection Error' : 
               'Login failed due to an internal server error', 
      error: error.message || 'Unknown error',
      errorName: error.name,
      stack: error.stack, // Always show stack for debugging
      hint: isAuthError ? 'Please check your MONGODB_URI credentials in Settings.' : undefined,
      debugInfo: {
        dbState: mongoose.connection.readyState,
        isDbConnected: mongoose.connection.readyState === 1
      }
    };
    console.log('[LOGIN_FATAL_RESPONSE_SENDING]', JSON.stringify(errorResponse));
    res.status(isAuthError || isConnectionError ? 503 : 500).json(errorResponse);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ 
        authenticated: false, 
        error: 'No user ID found in request. Auth middleware might have failed.' 
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        authenticated: false, 
        error: 'User not found in database' 
      });
    }
    
    // Transform to consistent frontend structure
    res.json({
      authenticated: true,
      token: req.cookies?.token, // Include token from cookie so SPA can have it for side-channels
      user: {
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
        aetherPoints: user.aetherPoints || 0,
        monthlyUploadCount: user.monthlyUploadCount || 0,
        lastUploadResetDate: user.lastUploadResetDate,
        followersCount: user.followersCount || 0,
        friendsCount: user.friendsCount || 0,
        following: user.following || [],
        achievements: user.achievements || [],
        bio: user.bio || '',
        location: user.location || '',
        handle: user.handle || ''
      }
    });
  } catch (error: any) {
    console.error('[GET_ME_FATAL_ERROR_OBJECT]', error);
    res.status(500).json({ 
      authenticated: false,
      message: 'Failed to fetch user data', 
      error: error.message || 'Unknown error',
      debugInfo: {
        userId: (req as any).userId,
        dbState: mongoose.connection.readyState
      }
    });
  }
};
