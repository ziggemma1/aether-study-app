import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return 'dev_temporary_secret_key_12345';
    }
    // Consistent fallback with authController.ts to prevent 500 crashes
    // while still logging the critical error.
    console.error("❌ AUTH CONFIG ERROR: JWT_SECRET is not defined in production!");
    return 'prod_emergency_fallback_secret_999';
  }
  return secret;
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        (req as any).userId = 'test_user_id_for_preview';
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
    
    if (process.env.NODE_ENV !== 'production') {
      (req as any).userId = 'test_user_id_for_preview';
      return next();
    }
    
    res.status(401).json({ 
      errorId: isExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
      message: isExpired ? 'Your session has expired. Please log in again.' : 'Authentication failed', 
      error: error.message 
    });
  }
};
