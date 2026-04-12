import { Request, Response } from 'express';
import { User } from '../models/User';

export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('name avatar streak').sort({ streak: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
