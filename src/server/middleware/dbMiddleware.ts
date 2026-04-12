import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    let status = 503;
    let message = 'Database is not connected.';
    
    if (state === 0) message += ' Connection is disconnected.';
    if (state === 2) message += ' Connection is currently being established.';
    if (state === 3) message += ' Connection is disconnecting.';
    
    message += ' Please ensure your MONGODB_URI is correct and your IP is whitelisted in MongoDB Atlas (try adding 0.0.0.0/0 for testing).';
    
    return res.status(status).json({ message });
  }
  next();
};
