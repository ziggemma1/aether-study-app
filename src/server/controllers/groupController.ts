import { Request, Response } from 'express';
import { Group } from '../models/Group.js';
import { isGroupMember } from '../lib/groupMembership.js';

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, avatar, members } = req.body;
    const userId = (req as any).userId;

    const group = new Group({
      name,
      description,
      avatar,
      admin: userId,
      members: [userId, ...(members || [])]
    });

    await group.save();
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const groups = await Group.find({ members: userId }).populate('admin', 'name avatar');
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.body;
    const group = await Group.findById(groupId);
    
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== (req as any).userId) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    if (!isGroupMember(group, memberId)) {
      group.members.push(memberId);
      await group.save();
    }

    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
