import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database connection is not ready. Please try again in a few seconds.',
      status: 'error',
      dbState: mongoose.connection.readyState
    });
  }
  next();
};
