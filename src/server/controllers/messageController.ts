import { Request, Response } from 'express';
import { Message } from '../models/Message.js';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { receiverId, groupId } = req.query;
    
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
    const { receiverId, content } = req.body;
    const message = new Message({
      senderId: (req as any).userId,
      receiverId,
      content
    });
    await message.save();
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
