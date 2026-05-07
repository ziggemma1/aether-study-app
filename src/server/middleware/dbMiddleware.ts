import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Global cache for serverless environments
let isConnected = false;

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[DB_CHECK] Request to ${req.url}, State: ${mongoose.connection.readyState}`);
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      message: 'Database Configuration Error: Missing MONGODB_URI',
      error: 'The MONGODB_URI environment variable is not set.',
      hint: 'Please go to the Settings menu in AI Studio, find Environment Variables, and add MONGODB_URI with your MongoDB Atlas connection string.'
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
      serverSelectionTimeoutMS: 15000, 
      connectTimeoutMS: 15000,
      bufferCommands: true, // Allow buffering temporarily to prevent immediate crashes
    });
    isConnected = db.connections[0].readyState === 1;
    return next();
  } catch (error: any) {
    console.error('❌ Failed to connect to DB:', error.message);
    
    let userFriendlyMessage = 'Database connection in progress. Please wait a few seconds and try again.';
    let hint = 'This usually happens during the first boot or cold starts.';

    if (error.message.includes('authentication failed')) {
      userFriendlyMessage = 'Database Authentication Failed';
      hint = 'Your MONGODB_URI contains incorrect credentials. Please check your MongoDB password in the Environment Variables Settings.';
    } else if (error.message.includes('IP address') || error.message.includes('whitelist')) {
      userFriendlyMessage = 'Database Access Denied (IP Whitelist)';
      hint = 'Ensure your MongoDB Atlas project allows connections from any IP (0.0.0.0/0) for these environments.';
    }

    return res.status(503).json({ 
      message: userFriendlyMessage,
      state: mongoose.connection.readyState,
      error: error.message,
      hint
    });
  }
};
