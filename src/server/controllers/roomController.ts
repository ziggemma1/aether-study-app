import { Request, Response } from 'express';
import Room from '../models/Room.js';

export const getRooms = async (req: Request, res: Response) => {
  try {
    // `activeCount` and `participants` are kept current by socket.ts, which
    // rewrites them on every join, leave and disconnect. Populating names and
    // avatars here lets the dashboard show who is actually in a room rather
    // than just a number.
    const rooms = await Room.find({ isPublic: true })
      .populate('participants', 'name avatar');
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, topic } = req.body;
    const newRoom = new Room({ name, topic });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
