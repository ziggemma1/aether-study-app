import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getJwtSecret } from '../lib/jwtSecret.js';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      if (process.env.MOCK_AUTH === 'true') {
        const mockId = '507f1f77bcf86cd799439011';
        const userExists = await User.exists({ _id: mockId });
        if (!userExists) {
          const mockUser = new User({
            _id: mockId,
            name: 'Preview Student',
            email: 'preview@aetherstudy.com',
            password: 'mock_password_hash_not_used',
            aetherPoints: 100,
            optedInLeaderboard: true
          });
          await mockUser.save();
          console.log('✅ Created mock preview user in database');
        }
        (req as any).userId = mockId;
        return next();
      }
      return res.status(401).json({ 
        errorId: 'AUTH_MISSING_TOKEN',
        message: 'Not authorized, no token' 
      });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { id: string };
    (req as any).userId = decoded.id;
    next();
  } catch (error: any) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', error.message);
    const isExpired = error.name === 'TokenExpiredError';
    
    if (process.env.MOCK_AUTH === 'true') {
      (req as any).userId = '507f1f77bcf86cd799439011';
      return next();
    }
    
    res.status(401).json({ 
      errorId: isExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
      message: isExpired ? 'Your session has expired. Please log in again.' : 'Authentication failed', 
      error: error.message 
    });
  }
};
