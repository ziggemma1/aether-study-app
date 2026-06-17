import { Request, Response } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // Find all users this user has messaged or received messages from
    const sentMessages = await Message.distinct('receiverId', { senderId: userId, receiverId: { $ne: null } });
    const receivedMessages = await Message.distinct('senderId', { receiverId: userId, senderId: { $ne: null } });
    
    const contactIds = Array.from(new Set([...sentMessages, ...receivedMessages]));
    
    const conversations = await User.find({ _id: { $in: contactIds } })
      .select('name avatar followers following');
    
    // Supplement with last message for each
    const conversationsWithLastMsg = await Promise.all(conversations.map(async (conv) => {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: conv._id },
          { senderId: conv._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });
      
      const unreadCount = await Message.countDocuments({
        senderId: conv._id,
        receiverId: userId,
        isRead: false
      });

      const isFriend = conv.following.includes(userId); // Assuming 'following' means they follow. But usually it's mutual.
      
      return {
        id: conv._id,
        name: conv.name,
        avatar: conv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.name}`,
        lastMsg: lastMsg ? lastMsg.content : 'No messages',
        time: lastMsg ? lastMsg.createdAt : null,
        unread: unreadCount,
        type: 'private',
        isFriend
      };
    }));

    res.json(conversationsWithLastMsg);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { receiverId, groupId } = req.query;
    
    // Optional: Filter messages to only show friends' chats if needed, 
    // but usually historical messages are fine if they WERE once friends.
    // However, let's stick to restricting NEW messages first.
    
    let query: any = {};
    if (groupId) {
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

