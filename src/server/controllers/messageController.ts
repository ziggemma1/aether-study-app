import { Request, Response } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { receiverId, groupId } = req.query;
    
    // Optional: Filter messages to only show friends' chats if needed, 
    // but usually historical messages are fine if they WERE once friends.
    // However, let's stick to restricting NEW messages first.
    
    let query: any = {};
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      query = { groupId };
    } else if (receiverId) {
      query = {
        $or: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      };
    } else {
      query = {
        $or: [{ senderId: userId }, { receiverId: userId }]
      };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, groupId, content } = req.body;
    const userId = (req as any).userId;

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
    } else if (receiverId) {
      const currentUser = await User.findById(userId);
      const targetUser = await User.findById(receiverId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const isFriend = currentUser.following.includes(receiverId) && targetUser.following.includes(userId);
      if (!isFriend) {
        return res.status(403).json({ message: "You can only message friends (mutual followers)" });
      }
    }

    const message = new Message({
      senderId: userId,
      receiverId,
      groupId,
      content
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

