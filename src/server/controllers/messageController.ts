import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { isGroupMember } from '../lib/groupMembership.js';

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
      if (!group || !isGroupMember(group, userId)) {
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

/**
 * The conversation list: who you have actually talked to, what was said last,
 * when, and how much of it you have not read.
 *
 * The Messages page used to build this list from `allProfiles` — every mutual
 * follower, each captioned with the literal string "Tap to message" and an
 * empty timestamp. It was a contact list wearing a conversation list's clothes:
 * nothing on it came from a message.
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const uid = new mongoose.Types.ObjectId(String(userId));

    // --- Direct messages, newest first, collapsed per partner ---
    const threads = await Message.aggregate([
      { $match: { groupId: null, $or: [{ senderId: uid }, { receiverId: uid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$senderId', uid] }, '$receiverId', '$senderId'] },
          lastMessage: { $first: '$content' },
          lastAt: { $first: '$createdAt' },
          lastSenderId: { $first: '$senderId' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', uid] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const partnerIds = threads.map((t) => t._id).filter(Boolean);
    const partners = await User.find({ _id: { $in: partnerIds } }).select('name avatar');
    const partnerById = new Map(partners.map((p: any) => [p._id.toString(), p]));

    // Mutual-follow decides whether the composer is open, and the socket
    // enforces the same rule — so the list has to report it, not guess.
    const me = await User.findById(userId).select('following');
    const following: string[] = (me?.following || []).map(String);
    const followers = await User.find({ following: String(userId) }).select('_id');
    const followerIds = new Set(followers.map((f: any) => f._id.toString()));

    const direct = threads
      .filter((t) => t._id && partnerById.has(t._id.toString()))
      .map((t) => {
        const id = t._id.toString();
        const p: any = partnerById.get(id);
        return {
          id,
          type: 'private' as const,
          name: p.name,
          avatar: p.avatar || null,
          lastMessage: t.lastMessage,
          lastAt: t.lastAt,
          sentByMe: t.lastSenderId?.toString() === String(userId),
          unread: t.unread,
          isFriend: following.includes(id) && followerIds.has(id)
        };
      });

    // --- Groups you belong to, with their last message ---
    const groups = await Group.find({ members: userId }).select('name avatar');
    const groupIds = groups.map((g: any) => g._id);
    const groupLast = await Message.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$groupId',
          lastMessage: { $first: '$content' },
          lastAt: { $first: '$createdAt' },
          lastSenderId: { $first: '$senderId' }
        }
      }
    ]);
    const lastByGroup = new Map(groupLast.map((g) => [g._id.toString(), g]));

    const groupThreads = groups.map((g: any) => {
      const last: any = lastByGroup.get(g._id.toString());
      return {
        id: g._id.toString(),
        type: 'group' as const,
        name: g.name,
        avatar: g.avatar || null,
        lastMessage: last?.lastMessage || null,
        lastAt: last?.lastAt || null,
        sentByMe: last?.lastSenderId?.toString() === String(userId),
        // Read state is a single boolean on the message, so it cannot say who
        // in a group has read what. Reporting 0 rather than inventing a count.
        unread: 0,
        isFriend: true
      };
    });

    const all = [...direct, ...groupThreads].sort((a, b) => {
      const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return bt - at;
    });

    res.json({
      conversations: all,
      totalUnread: direct.reduce((sum, d) => sum + d.unread, 0)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Mark every message from one person to you as read. */
export const markConversationRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ message: 'fromUserId is required' });

    const result = await Message.updateMany(
      { senderId: fromUserId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ updated: result.modifiedCount });
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
      if (!group || !isGroupMember(group, userId)) {
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
