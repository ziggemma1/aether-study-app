import { Request, Response } from 'express';
import Room from '../models/Room.js';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({ isPublic: true });
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
