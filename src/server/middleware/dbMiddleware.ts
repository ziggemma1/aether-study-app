import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Global cache for serverless environments
let isConnected = false;

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[DB_CHECK] Request to ${req.url}, State: ${mongoose.connection.readyState}`);
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri || rawUri.trim() === '') {
    return res.status(500).json({
      message: 'Database Configuration Error: Missing MONGODB_URI',
      error: 'The MONGODB_URI environment variable is empty or not set.',
      hint: 'Please go to the Settings menu in AI Studio, find Environment Variables, and add MONGODB_URI with your MongoDB Atlas connection string.'
    });
  }

  let uri = rawUri.trim();
  
  // Clean common mistakes: trailing/leading quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.substring(1, uri.length - 1).trim();
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return res.status(500).json({
      message: 'Database Configuration Error: Invalid MONGODB_URI Scheme',
      error: 'The connection string must start with "mongodb://" or "mongodb+srv://".',
      hint: 'Your URI currently starts with: ' + uri.substring(0, 10) + '... (check for leading spaces or quotes in your Environment Variables)'
    });
  }

  // Use cached connection state in serverless to reduce readyState checks
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return next();
  }

  console.log('⏳ DB is not connected. Attempting to connect...');
  try {
    const db = await mongoose.connect(uri, {
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
