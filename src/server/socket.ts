import { Server } from "socket.io";
import mongoose from "mongoose";
import { Message } from "./models/Message.js";
import { Group } from "./models/Group.js";
import { User } from "./models/User.js";
import Room from "./models/Room.js";
import jwt from "jsonwebtoken";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        callback(null, true);
      },
      credentials: true
    }

  });

  io.use((socket, next) => {
    let token = socket.handshake.auth.token;
    
    // Normalize "null" or "undefined" strings that might come from client state
    if (token === "null" || token === "undefined") token = null;

    // Try to get token from cookies if not in auth
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return next(new Error("Authentication error: No token found"));
    }

    try {
      const secret = process.env.JWT_SECRET || 'secret';
      const decoded = jwt.verify(token, secret) as any;
      socket.data.userId = decoded.id; // Use official data property for cross-process access
      next();
    } catch (err) {
      console.error("Socket Auth Error:", (err as Error).message);
      next(new Error("Authentication error: Token invalid"));
    }
  });


  io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Track active live room for this socket
    let activeLiveRoomId: string | null = null;

    // Pre-fetch user data once for this socket session
    try {
      const user = await User.findById(userId).select('name avatar');
      if (user) {
        socket.data.user = {
          id: user._id.toString(),
          name: user.name,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || userId}`
        };
      }
    } catch (err) {
      console.error("Error fetching user on connection:", err);
    }

    // Join personal room for 1-on-1 messages
    socket.join(userId);

    // LIVE ROOMS LOGIC
    const broadcastRoomParticipants = async (roomId: string) => {
      const roomName = `live_room:${roomId}`;
      const sockets = await io.in(roomName).fetchSockets();
      const participantsMap = new Map();
      
      console.log(`Checking participants for room ${roomName}. Found ${sockets.length} sockets.`);
      
      for (const s of sockets) {
        const pUserId = s.data.userId ? String(s.data.userId) : null;
        // Even if pUserId is missing, we should probably try to identify the socket
        
        let pUser = s.data.user;
        if (!pUser && pUserId) {
          try {
            const dbUser = await User.findById(pUserId).select('name avatar');
            if (dbUser) {
              pUser = {
                id: dbUser._id.toString(),
                name: dbUser.name,
                avatar: dbUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.name || pUserId}`
              };
              s.data.user = pUser;
            } else {
              pUser = {
                id: pUserId,
                name: `Learner ${pUserId.slice(-4)}`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pUserId}`
              };
              s.data.user = pUser;
            }
          } catch (err) {
            console.error(`Error fetching user ${pUserId}:`, err);
          }
        }
        
        if (pUser) {
          // Use instance ID (socket.id) as the key to allow multiple connections from the same user
          const instanceId = s.id;
          participantsMap.set(instanceId, {
            ...pUser,
            instanceId: instanceId
          });
        } else {
          // Last resort fallback for unidentifiable but connected socket
          const instanceId = s.id;
          participantsMap.set(instanceId, {
            id: `anon-${instanceId.slice(-4)}`,
            name: "Learner",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${instanceId}`,
            instanceId
          });
        }
      }
      
      const participants = Array.from(participantsMap.values());
      console.log(`Broadcasting ${participants.length} participants for room ${roomId}:`, participants.map(p => p.name));
      
      // Update room active count in DB
      try {
        const uniqueUserIds = Array.from(new Set(participants.filter(p => !p.id.startsWith('anon-')).map(p => p.id)));
        await Room.findByIdAndUpdate(roomId, { 
          activeCount: participants.length,
          participants: uniqueUserIds
        });
      } catch (dbErr) {
        console.error("DB Room Update Error:", dbErr);
      }
      
      io.to(roomName).emit("room_participants", { roomId, participants });
      return participants;
    };

    socket.on("join_live_room", async (roomId) => {
      try {
        const roomName = `live_room:${roomId}`;
        activeLiveRoomId = roomId;
        await socket.join(roomName);
        
        // Ensure user data is present for this socket
        if (!socket.data.user) {
          const user = await User.findById(userId).select('name avatar');
          if (user) {
            socket.data.user = {
              id: user._id.toString(),
              name: user.name,
              avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || userId}`
            };
          }
        }
        
        const participants = await broadcastRoomParticipants(roomId);
  
        // Also notify about the specific join for the toast
        // IMPORTANT: Include instanceId (socket.id) to distinguish between connections of same user
        const user = {
          ...(socket.data.user || { id: String(userId), name: "Learner", avatar: "" }),
          instanceId: socket.id
        };
        
        socket.to(roomName).emit("user_joined_room", { 
          roomId, 
          user
        });
        
        console.log(`User ${userId} joined live room: ${roomId}. Total: ${participants.length}`);
      } catch (err) {
        console.error("Join room error:", err);
      }
    });

    socket.on("leave_live_room", async (roomId) => {
      try {
        const roomName = `live_room:${roomId}`;
        socket.leave(roomName);
        activeLiveRoomId = null;
        
        // Notify others
        io.to(roomName).emit("user_left_room", { 
          userId: String(userId), 
          roomId,
          instanceId: socket.id 
        });
        
        // Refresh list for others
        await broadcastRoomParticipants(roomId);
      } catch (err) {
        console.error("Leave room error:", err);
      }
    });

    socket.on("sync_pomodoro", (data) => {
      const { roomId, timeLeft, isPaused } = data;
      // Broadcast timer state to others in room
      socket.to(`live_room:${roomId}`).emit("timer_sync", { userId, timeLeft, isPaused });
    });

    socket.on("send_room_message", ({ roomId, content }) => {
      const roomName = `live_room:${roomId}`;
      const user = socket.data.user;
      
      const message = {
        id: `msg_${Date.now()}`,
        roomId,
        senderId: userId,
        senderName: user?.name || "Learner",
        senderAvatar: user?.avatar || "",
        content,
        timestamp: new Date().toISOString()
      };

      console.log(`Live Room Message [${roomId}]: ${user?.name}: ${content}`);
      io.to(roomName).emit("received_room_message", message);
    });

    socket.on("send_nudge", async ({ targetUserId }) => {
      const sender = await User.findById(userId).select('name');
      io.to(targetUserId).emit("received_nudge", { fromUserId: userId, fromUserName: sender?.name || 'A friend' });
    });
    // END LIVE ROOMS LOGIC

    socket.on("get-unread-counts", async ({ userId }) => {
      try {
        const unreadCounts = await Message.aggregate([
          { $match: { receiverId: new mongoose.Types.ObjectId(userId), isRead: false } },
          { $group: { _id: "$senderId", count: { $sum: 1 } } }
        ]);
        
        const counts: Record<string, number> = {};
        unreadCounts.forEach(c => {
          if (c._id) counts[c._id.toString()] = c.count;
        });
        
        socket.emit("unread-counts", counts);
      } catch (err) {
        console.error("Error fetching unread counts:", err);
      }
    });

    socket.on("load-dm-history", async ({ withUserId, currentUserId }) => {
      try {
        const messages = await Message.find({
          $or: [
            { senderId: currentUserId, receiverId: withUserId },
            { senderId: withUserId, receiverId: currentUserId }
          ]
        }).sort({ createdAt: 1 }).limit(100);
        
        const formattedMessages = messages.map(m => ({
          _id: m._id.toString(),
          fromUserId: m.senderId.toString(),
          toUserId: m.receiverId?.toString(),
          text: m.content,
          timestamp: m.createdAt.toISOString(),
          isRead: m.isRead
        }));
        
        socket.emit("dm-history", { withUserId, messages: formattedMessages });
      } catch (err) {
        console.error("Error loading DM history:", err);
      }
    });

    socket.on("mark-dm-read", async ({ fromUserId, currentUserId }) => {
      try {
        await Message.updateMany(
          { senderId: fromUserId, receiverId: currentUserId, isRead: false },
          { $set: { isRead: true } }
        );
        // Notify sender that their messages were read
        io.to(fromUserId).emit("messages-read", { readerId: currentUserId });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    socket.on("join-group-chat", (groupId) => {
      socket.join(groupId);
      console.log(`User ${userId} joined group: ${groupId}`);
    });

    socket.on("leave-group-chat", (groupId) => {
      socket.leave(groupId);
      console.log(`User ${userId} left group: ${groupId}`);
    });

    socket.on("load-group-history", async ({ groupId }) => {
      try {
        const messages = await Message.find({ groupId }).sort({ createdAt: 1 }).limit(100);
        const formattedMessages = messages.map(m => ({
          _id: m._id.toString(),
          fromUserId: m.senderId.toString(),
          groupId: m.groupId?.toString(),
          text: m.content,
          timestamp: m.createdAt.toISOString()
        }));
        socket.emit("group-history", { groupId, messages: formattedMessages });
      } catch (err) {
        console.error("Error loading group history:", err);
      }
    });

    socket.on("send-dm", async (data) => {
      const { toUserId, text, fromUserId, fromUserName } = data;
      try {
        // Enforce friendship check if desired
        const newMessage = new Message({
          senderId: fromUserId,
          receiverId: toUserId,
          content: text
        });
        await newMessage.save();
        
        const msg: any = {
          _id: newMessage._id.toString(),
          fromUserId,
          toUserId,
          fromUserName,
          text,
          timestamp: newMessage.createdAt.toISOString(),
          isRead: false
        };
        
        io.to(toUserId).emit("receive-dm", msg);
        io.to(fromUserId).emit("receive-dm", msg); // Also send back to sender's other tabs
      } catch (err) {
        console.error("Error sending DM:", err);
      }
    });

    socket.on("send-group-message", async (data) => {
      const { groupId, text, userId, userName } = data;
      try {
        const newMessage = new Message({
          senderId: userId,
          groupId,
          content: text
        });
        await newMessage.save();
        
        const msg: any = {
          _id: newMessage._id.toString(),
          fromUserId: userId,
          fromUserName: userName,
          groupId,
          text,
          timestamp: newMessage.createdAt.toISOString()
        };
        
        io.to(groupId).emit("receive-group-message", msg);
      } catch (err) {
        console.error("Error sending Group message:", err);
      }
    });

    socket.on("typing-dm", ({ toUserId, fromUserId, isTyping }) => {
      socket.to(toUserId).emit("user-typing", { fromUserId, isTyping });
    });

    socket.on("typing-group", ({ groupId, userId, isTyping }) => {
      socket.to(groupId).emit("group-typing", { groupId, fromUserId: userId, isTyping });
    });

    socket.on("disconnect", async () => {
      if (activeLiveRoomId) {
        const roomId = activeLiveRoomId;
        const roomName = `live_room:${roomId}`;
        io.to(roomName).emit("user_left_room", { 
          userId: String(userId), 
          roomId,
          instanceId: socket.id
        });
        
        // Update count and re-broadcast
        try {
          await broadcastRoomParticipants(roomId);
        } catch (err) {
          console.error("Disconnect room update error:", err);
        }
      }
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

