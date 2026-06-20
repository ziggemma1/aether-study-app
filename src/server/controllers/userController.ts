import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';

export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('name avatar streak following followers followersCount friendsCount totalStudyTime aetherPoints optedInLeaderboard handle').sort({ aetherPoints: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const { receiverId } = req.body;
    const senderId = (req as any).userId;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    // Check if already friends
    const sender = await User.findById(senderId);
    if (sender?.following.includes(receiverId)) {
      // Check if it's already a mutual thing
      const receiver = await User.findById(receiverId);
      if (receiver?.following.includes(senderId)) {
        return res.status(400).json({ message: "You are already friends." });
      }
    }

    // Check for existing request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: "A friend request is already pending." });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: "You are already friends." });
      }
    }

    const request = new FriendRequest({ senderId, receiverId, status: 'pending' });
    await request.save();

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const requests = await FriendRequest.find({ 
      receiverId: userId, 
      status: 'pending' 
    }).populate('senderId', 'name avatar streak');
    
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId, status } = req.body; // 'accepted' or 'declined'
    const userId = (req as any).userId;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.receiverId !== userId) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      const sender = await User.findById(request.senderId);
      const receiver = await User.findById(request.receiverId);

      if (sender && receiver) {
        // Mutual follow for friendship
        if (!sender.following.includes(receiver.id)) {
          sender.following.push(receiver.id);
          receiver.followers.push(sender.id);
        }
        if (!receiver.following.includes(sender.id)) {
          receiver.following.push(sender.id);
          sender.followers.push(receiver.id);
        }

        sender.friendsCount = sender.following.length;
        receiver.friendsCount = receiver.following.length;
        sender.followersCount = sender.followers.length;
        receiver.followersCount = receiver.followers.length;

        await sender.save();
        await receiver.save();
      }
    }

    res.json({ message: `Request ${status}`, request });
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
      aetherPoints: user.aetherPoints,
      freezeTokens: user.freezeTokens,
      optedInLeaderboard: user.optedInLeaderboard,
      followersCount: user.followersCount,
      friendsCount: user.friendsCount,
      following: user.following || [],
      achievements: user.achievements
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLeaderboardOptIn = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.optedInLeaderboard = !user.optedInLeaderboard;
    await user.save();
    res.json({ optedInLeaderboard: user.optedInLeaderboard });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const purchaseShopItem = async (req: Request, res: Response) => {
  try {
    const { cost, itemName, isFreeze } = req.body;
    const user = await User.findById((req as any).userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.aetherPoints < cost) {
      return res.status(400).json({ message: "Insufficient Aether Points" });
    }

    user.aetherPoints -= cost;
    if (isFreeze) {
      user.freezeTokens += 1;
    } else {
      user.themeUnlocked.push(itemName);
    }

    await user.save();
    res.json({ 
      aetherPoints: user.aetherPoints, 
      freezeTokens: user.freezeTokens,
      themeUnlocked: user.themeUnlocked 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const penalizePoints = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const user = await User.findById((req as any).userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.aetherPoints = Math.max(0, user.aetherPoints - (amount || 50));
    await user.save();
    res.json({ aetherPoints: user.aetherPoints });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
