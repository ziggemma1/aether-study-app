import mongoose from 'mongoose';

export const checkDbConnection = (req: any, res: any, next: any) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection failed. Please ensure MONGODB_URI is set in Vercel and Network Access in MongoDB Atlas allows 0.0.0.0/0.' });
  }
  next();
};
