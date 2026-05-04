import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const PORT = process.env.PORT || 4000;

// Middleware for Health Check
app.get('/health', (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV });
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas for Persistent Messaging'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const directMessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupChat', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Models (Notice: collections names as requested)
const DirectMessage = mongoose.model('direct_messages', directMessageSchema);
const GroupChat = mongoose.model('group_chats', groupChatSchema);
const GroupMessage = mongoose.model('group_messages', groupMessageSchema);
// We might need to reference the User model if it exists in the same DB
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String }));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
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
  console.log(`[CONN] User Connected: ${userId} (Socket: ${socket.id})`);

  // --- DM Events ---

  socket.on('send-dm', async ({ toUserId, text, fromUserId, fromUserName }) => {
    try {
      if (!text.trim()) return;
      
      const newMsg = new DirectMessage({
        fromUserId: userId,
        toUserId,
        text
      });
      await newMsg.save();

      const recipientSocketId = getSocketId(toUserId);
      const payload = {
        _id: newMsg._id,
        fromUserId,
        fromUserName,
        text,
        timestamp: newMsg.timestamp,
        isRead: false
      };

      // Emit to recipient if online
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-dm', payload);
      }

      // Also send back to sender for confirmation/sync
      socket.emit('dm-sent', payload);
      
      console.log(`[DM] From ${fromUserId} to ${toUserId}: ${text.slice(0, 20)}...`);
    } catch (err) {
      console.error('[ERR] send-dm:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('load-dm-history', async ({ withUserId, currentUserId }) => {
    try {
      const messages = await DirectMessage.find({
        $or: [
          { fromUserId: currentUserId, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: currentUserId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50);

      socket.emit('dm-history', messages.reverse());
    } catch (err) {
      console.error('[ERR] load-dm-history:', err);
    }
  });

  socket.on('mark-dm-read', async ({ fromUserId, currentUserId }) => {
    try {
      await DirectMessage.updateMany(
        { fromUserId, toUserId: currentUserId, isRead: false },
        { $set: { isRead: true } }
      );
      
      // Notify sender if online
      const senderSocketId = getSocketId(fromUserId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages-marked-read', { byUserId: currentUserId });
      }
    } catch (err) {
      console.error('[ERR] mark-dm-read:', err);
    }
  });

  // --- Group Chat Events ---

  socket.on('join-group-chat', async ({ groupId }) => {
    socket.join(String(groupId));
    console.log(`[GROUP] User ${userId} joined room ${groupId}`);
  });

  socket.on('leave-group-chat', ({ groupId }) => {
    socket.leave(String(groupId));
    console.log(`[GROUP] User ${userId} left room ${groupId}`);
  });

  socket.on('send-group-message', async ({ groupId, text, userId: msgUserId, userName }) => {
    try {
      if (!text.trim()) return;

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
      const messages = await GroupMessage.find({ groupId })
        .sort({ timestamp: -1 })
        .limit(50);
      
      socket.emit('group-history', { groupId, messages: messages.reverse() });
    } catch (err) {
      console.error('[ERR] load-group-history:', err);
    }
  });

  // --- Helper Events ---

  socket.on('get-unread-counts', async ({ userId: currentUserId }) => {
    try {
      const counts = await DirectMessage.aggregate([
        { $match: { toUserId: new mongoose.Types.ObjectId(currentUserId), isRead: false } },
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

  socket.on('typing-dm', ({ toUserId, fromUserId, isTyping }) => {
    const targetSocketId = getSocketId(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user-typing', { fromUserId, isTyping });
    }
  });

  socket.on('typing-group', ({ groupId, userId: typingUserId, isTyping }) => {
    socket.to(String(groupId)).emit('group-typing', { groupId, userId: typingUserId, isTyping });
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
