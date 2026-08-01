import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import { getJwtSecret } from './src/server/lib/jwtSecret.js';
import { isAllowedOrigin } from './src/server/lib/allowedOrigins.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = getJwtSecret();
const PORT = process.env.PORT || 4000;

if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not defined in environment variables.");
}

// Middleware for Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: "ok", 
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV,
    connections: io?.engine?.clientsCount || 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// MongoDB Connection
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas for Persistent Messaging'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// MongoDB Schemas
const directMessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Membership lives in the main app's `groups` collection (see
// src/server/models/Group.ts) — group chat here was previously checked
// against a separate, never-populated `group_chats` collection that nothing
// in the app ever wrote to, so it could never have enforced anything. This
// points at the real collection instead.
const groupMembershipSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { strict: false });

// Models (Notice: collections names as requested)
const DirectMessage = mongoose.model('direct_messages', directMessageSchema);
const Group = mongoose.model('Group', groupMembershipSchema, 'groups');
const GroupMessage = mongoose.model('group_messages', groupMessageSchema);
// We might need to reference the User model if it exists in the same DB
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String }));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
});

// Online Users Map (userId -> socketId)
const onlineUsers = new Map();

// Helper to find a user's socketId
const getSocketId = (userId) => onlineUsers.get(String(userId));

// Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.userId = decoded.id;
    next();
  });
});

io.on('connection', (socket) => {
  const userId = String(socket.userId);
  onlineUsers.set(userId, socket.id);
  socket.join(userId); // Join a room for the user ID to handle multi-tab sync
  console.log(`[CONN] User Connected: ${userId} (Socket: ${socket.id})`);

  // --- DM Events ---

  // Every handler below trusts only `userId` (resolved from the verified JWT
  // at connection time) for "who is this" — never a client-supplied id field
  // in the event payload, which a modified client could set to anyone.

  socket.on('send-dm', async ({ toUserId, text, fromUserName }) => {
    try {
      if (!text.trim()) return;

      const newMsg = new DirectMessage({
        fromUserId: userId,
        toUserId,
        text
      });
      await newMsg.save();

      const payload = {
        _id: newMsg._id,
        fromUserId: userId,
        toUserId,
        fromUserName,
        text,
        timestamp: newMsg.timestamp,
        isRead: false
      };

      // Emit to both the sender and the recipient rooms
      io.to(userId).to(String(toUserId)).emit('receive-dm', payload);

      console.log(`[DM] From ${userId} to ${toUserId}: ${text.slice(0, 20)}...`);
    } catch (err) {
      console.error('[ERR] send-dm:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('load-dm-history', async ({ withUserId }) => {
    try {
      const messages = await DirectMessage.find({
        $or: [
          { fromUserId: userId, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50);

      socket.emit('dm-history', { withUserId, messages: messages.reverse() });
    } catch (err) {
      console.error('[ERR] load-dm-history:', err);
    }
  });

  socket.on('mark-dm-read', async ({ fromUserId }) => {
    try {
      await DirectMessage.updateMany(
        { fromUserId, toUserId: userId, isRead: false },
        { $set: { isRead: true } }
      );

      // Notify sender if online
      const senderSocketId = getSocketId(fromUserId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages-marked-read', { byUserId: userId });
      }
    } catch (err) {
      console.error('[ERR] mark-dm-read:', err);
    }
  });

  // --- Group Chat Events ---

  const isGroupMember = async (groupId) => {
    const group = await Group.findById(groupId).select('members');
    return !!group && group.members.some((m) => String(m) === userId);
  };

  socket.on('join-group-chat', async ({ groupId }) => {
    if (!(await isGroupMember(groupId))) {
      return socket.emit('error', { message: 'You are not a member of this group' });
    }
    socket.join(String(groupId));
    console.log(`[GROUP] User ${userId} joined room ${groupId}`);
  });

  socket.on('leave-group-chat', ({ groupId }) => {
    socket.leave(String(groupId));
    console.log(`[GROUP] User ${userId} left room ${groupId}`);
  });

  socket.on('send-group-message', async ({ groupId, text, userName }) => {
    try {
      if (!text.trim()) return;
      if (!(await isGroupMember(groupId))) {
        return socket.emit('error', { message: 'You are not a member of this group' });
      }

      const newMsg = new GroupMessage({
        groupId,
        fromUserId: userId,
        fromUserName: userName,
        text
      });
      await newMsg.save();

      const payload = {
        _id: newMsg._id,
        groupId,
        fromUserId: userId,
        fromUserName: userName,
        text,
        timestamp: newMsg.timestamp
      };

      io.to(String(groupId)).emit('receive-group-message', payload);
      console.log(`[GROUP MSG] In ${groupId} by ${userName}: ${text.slice(0, 20)}...`);
    } catch (err) {
      console.error('[ERR] send-group-message:', err);
    }
  });

  socket.on('load-group-history', async ({ groupId }) => {
    try {
      if (!(await isGroupMember(groupId))) {
        return socket.emit('error', { message: 'You are not a member of this group' });
      }
      const messages = await GroupMessage.find({ groupId })
        .sort({ timestamp: -1 })
        .limit(50);
      
      socket.emit('group-history', { groupId, messages: messages.reverse() });
    } catch (err) {
      console.error('[ERR] load-group-history:', err);
    }
  });

  // --- Helper Events ---

  socket.on('get-unread-counts', async () => {
    try {
      const counts = await DirectMessage.aggregate([
        { $match: { toUserId: new mongoose.Types.ObjectId(userId), isRead: false } },
        { $group: { _id: "$fromUserId", count: { $sum: 1 } } }
      ]);
      
      const countMap = {};
      counts.forEach(c => {
        countMap[c._id] = c.count;
      });
      
      socket.emit('unread-counts', countMap);
    } catch (err) {
      console.error('[ERR] get-unread-counts:', err);
    }
  });

  socket.on('typing-dm', ({ toUserId, isTyping }) => {
    const targetSocketId = getSocketId(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user-typing', { fromUserId: userId, isTyping });
    }
  });

  socket.on('typing-group', ({ groupId, isTyping }) => {
    socket.to(String(groupId)).emit('group-typing', { groupId, userId, isTyping });
  });

  // --- Connection Management ---

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`[DISCONN] User Disconnected: ${userId}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
