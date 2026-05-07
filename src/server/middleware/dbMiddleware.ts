import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Global cache for serverless environments
let isConnected = false;

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
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
      serverSelectionTimeoutMS: 15000, // increased timeout for serverless cold starts
      connectTimeoutMS: 15000,
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState === 1;
    return next();
  } catch (error: any) {
    console.error('Failed to connect to DB:', error);
    
    return res.status(503).json({ 
      message: 'Database connection in progress. Please wait a few seconds and try again.',
      state: mongoose.connection.readyState,
      error: error.message,
      hint: 'This usually happens during the first boot or cold starts. We are retrying the connection automatically.'
    });
  }
};
