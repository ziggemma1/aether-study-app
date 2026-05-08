import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Global cache for serverless environments
let isConnected = false;

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[DB_CHECK] Request to ${req.url}, State: ${mongoose.connection.readyState}`);
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri || rawUri.trim() === '') {
    return res.status(500).json({
      errorId: 'DB_MIDDLEWARE_MISSING_URI',
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
      errorId: 'DB_MIDDLEWARE_INVALID_SCHEME',
      message: 'Database Configuration Error: Invalid MONGODB_URI Scheme',
      error: 'The connection string must start with "mongodb://" or "mongodb+srv://".',
      hint: 'Your URI currently starts with: ' + uri.substring(0, 10) + '... (check for leading spaces or quotes in your Environment Variables)'
    });
  }

  // Skip if already connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return next();
  }

  console.log(`⏳ DB state is ${mongoose.connection.readyState}. Connection required for ${req.url}...`);
  try {
    // Mongoose connect() is singleton: if already connecting, it returns the existing promise.
    // We set a strict timeout to stay under Vercel's 10s limit.
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000, 
      connectTimeoutMS: 6000,
      bufferCommands: true, 
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ DB connected successfully via middleware');
    return next();
  } catch (error: any) {
    console.error('❌ Failed to connect to DB:', error.message);
    
    let userFriendlyMessage = 'Database connection failed. Please try again in moments.';
    let hint = 'This usually happens during cold starts or if the database is waking up.';

    const lowerError = error.message.toLowerCase();
    if (lowerError.includes('authentication failed')) {
      userFriendlyMessage = 'Database Authentication Failed';
      hint = 'Your MONGODB_URI contains incorrect credentials. Please check your MongoDB password in Settings.';
    } else if (lowerError.includes('ip address') || lowerError.includes('whitelist') || lowerError.includes('not authorized from this ip')) {
      userFriendlyMessage = 'Database Access Denied (IP Whitelist)';
      hint = 'Ensure your MongoDB Atlas project allows connections from any IP (0.0.0.0/0) in Security -> Network Access.';
    } else if (lowerError.includes('server selection timed out')) {
      userFriendlyMessage = 'Database Connection Timeout';
      hint = 'The server could not reach MongoDB. Check if your Atlas cluster is active and your internet/proxy allows connection.';
    } else if (lowerError.includes('enotfound') || lowerError.includes('getaddrinfo')) {
      userFriendlyMessage = 'Database Host Not Found';
      hint = 'The hostname in your MONGODB_URI is invalid or your DNS failed. Check for typos in the URI.';
    }

    return res.status(503).json({ 
      errorId: 'DB_MIDDLEWARE_CONN_EXCEPTION',
      message: userFriendlyMessage,
      state: mongoose.connection.readyState,
      error: error.message,
      hint
    });
  }
};
