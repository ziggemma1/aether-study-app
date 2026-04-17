import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  let state = mongoose.connection.readyState;
  
  // If connecting, wait longer (up to 30 seconds)
  if (state === 2) {
    console.log('⏳ DB is connecting, waiting up to 30s...');
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      state = mongoose.connection.readyState;
      if (state === 1) {
        console.log('✅ DB became ready!');
        break;
      }
    }
  }

  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  if (state === 1) {
    return next();
  }

  let status = 503;
  let message = 'Database is not ready.';
  
  if (state === 0) message = 'Database is disconnected. Please check your MONGODB_URI.';
  if (state === 2) message = 'Database is still connecting. Please wait a few seconds and try again.';
  if (state === 3) message = 'Database is disconnecting.';
  
  console.warn(`DB Connection State: ${state} - ${message}`);
  
  return res.status(status).json({ 
    message,
    state,
    hint: process.env.VERCEL 
      ? 'On Vercel, ensure you have added MONGODB_URI to your Project Settings > Environment Variables.' 
      : 'If this persists, ensure your MongoDB Atlas IP whitelist includes 0.0.0.0/0 for testing.'
  });
};
