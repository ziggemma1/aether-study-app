import { Request, Response } from 'express';
import { User } from '../models/User.js';

export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('name avatar streak following').sort({ streak: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const toggleFollow = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req as any).userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    // Update counts
    currentUser.friendsCount = currentUser.following.length;
    targetUser.followersCount = targetUser.followers.length;

    await currentUser.save();
    await targetUser.save();

    res.json({
      following: currentUser.following,
      friendsCount: currentUser.friendsCount,
      isFollowing: !isFollowing
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, language, curriculum, avatar, bio, location, handle } = req.body;
    const user = await User.findById((req as any).userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (language !== undefined) user.language = language;
    if (curriculum !== undefined) user.curriculum = curriculum;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    
    if (handle !== undefined) {
      // Check if handle is already taken
      if (handle !== user.handle) {
        const existingHandle = await User.findOne({ handle });
        if (existingHandle) {
          return res.status(400).json({ message: 'Handle already taken' });
        }
        user.handle = handle;
      }
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      streak: user.streak,
      curriculum: user.curriculum,
      language: user.language,
      plan: user.plan,
      bio: user.bio,
      location: user.location,
      handle: user.handle,
      points: user.points,
      followersCount: user.followersCount,
      friendsCount: user.friendsCount,
      following: user.following || [],
      achievements: user.achievements
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
