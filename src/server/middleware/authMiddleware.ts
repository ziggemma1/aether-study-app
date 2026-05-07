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
    console.error("❌ CRITICAL ERROR: JWT_SECRET is not defined in production middleware!");
    return 'prod_emergency_fallback_secret_999';
  }
  return secret;
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    (req as any).userId = decoded.id;
    next();
  } catch (error: any) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', error.message);
    res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
  }
};
