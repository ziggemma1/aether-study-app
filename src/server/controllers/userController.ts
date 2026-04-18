import { Request, Response } from 'express';
import { User } from '../models/User.js';

export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('name avatar streak').sort({ streak: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, language, curriculum, avatar } = req.body;
    const user = await User.findById((req as any).userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (language) user.language = language;
    if (curriculum) user.curriculum = curriculum;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      streak: user.streak,
      curriculum: user.curriculum,
      language: user.language,
      plan: user.plan
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
