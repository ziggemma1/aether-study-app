import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).userId = (decoded as any).id;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
