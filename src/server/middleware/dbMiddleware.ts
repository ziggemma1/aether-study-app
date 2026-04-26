import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Global cache for serverless environments
let isConnected = false;

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      message: 'Missing MongoDB URI',
      error: 'MONGODB_URI environment variable is not set.',
      hint: 'If you are deploying on Vercel, you must go to your Vercel Project Settings > Environment Variables, and add MONGODB_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, and APP_URL. Then trigger a new deployment.'
    });
  }

  // Use cached connection state in serverless to reduce readyState checks mapping
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return next();
  }

  console.log('⏳ DB is not connected. Attempting to connect...');
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // increased timeout for serverless cold starts
      connectTimeoutMS: 15000,
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState === 1;
    return next();
  } catch (error: any) {
    console.error('Failed to connect to DB:', error);
    
    return res.status(503).json({ 
      message: 'Servers are booting. Please check your connection or try again in a moment.',
      state: mongoose.connection.readyState,
      error: error.message,
      hint: process.env.VERCEL 
        ? 'On Vercel, ensure you have added MONGODB_URI to your Project Settings > Environment Variables.' 
        : 'If this persists, ensure your MongoDB Atlas IP whitelist includes 0.0.0.0/0 for testing.'
    });
  }
};
