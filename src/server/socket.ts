import { Server } from "socket.io";
import { Message } from "./models/Message.js";
import { Group } from "./models/Group.js";
import { User } from "./models/User.js";
import Room from "./models/Room.js";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./lib/jwtSecret.js";
import { isAllowedOrigin } from "./lib/allowedOrigins.js";
import { createNotification } from "./services/notification-service.js";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
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
      const secret = getJwtSecret();
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
      const senderName = sender?.name || 'A friend';
      io.to(targetUserId).emit("received_nudge", { fromUserId: userId, fromUserName: senderName });

      // The live shake only lands if the target has the room open — persist it
      // so a nudge sent to someone who's away isn't silently lost.
      await createNotification(targetUserId, `${senderName} nudged you to get studying!`, 'nudge');
    });
    // END LIVE ROOMS LOGIC

    socket.on("join_group", async (groupId) => {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        socket.emit("error_message", { message: "You are not a member of this group" });
        return;
      }
      socket.join(groupId);
      console.log(`User ${userId} joined group: ${groupId}`);
    });

    socket.on("send_message", async (data) => {
      const { receiverId, groupId, content } = data;

      try {
        // Enforce friendship/membership check
        if (groupId) {
          const group = await Group.findById(groupId);
          if (!group || !group.members.includes(userId)) {
            socket.emit("error_message", { message: "You are not a member of this group" });
            return;
          }
        } else if (receiverId) {
          const currentUser = await User.findById(userId);
          const targetUser = await User.findById(receiverId);

          if (!currentUser || !targetUser) {
            socket.emit("error_message", { message: "User not found" });
            return;
          }

          const isFriend = currentUser.following.includes(receiverId) && targetUser.following.includes(userId);
          if (!isFriend) {
            console.warn(`Messaging blocked: User ${userId} is not mutual friends with ${receiverId}`);
            socket.emit("error_message", { message: "You can only message friends (mutual followers)" });
            return;
          }
        }

        const newMessage = new Message({
          senderId: userId,
          receiverId,
          groupId,
          content
        });

        await newMessage.save();
        
        const messageToSend = {
          ...newMessage.toObject(),
          id: newMessage._id.toString()
        };

        console.log(`Message saved. Emitting to ${groupId ? "Group:" + groupId : "Users:" + userId + "," + receiverId}`);

        if (groupId) {
          io.to(groupId).emit("new_message", messageToSend);
        } else if (receiverId) {
          socket.emit("new_message", messageToSend); // Emit directly to the sending socket
          if (receiverId !== userId) {
            io.to(receiverId).emit("new_message", messageToSend);
            io.to(userId).emit("new_message", messageToSend); // Emit to other tabs of sender
          }
        }
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("error_message", { message: "Internal server error occurred while sending message." });
      }
    });

    socket.on("typing", async (data) => {
      const { receiverId, groupId, isTyping } = data;
      
      // Optional: Add friendship check for typing too to avoid leaking status
      if (groupId) {
        socket.to(groupId).emit("typing_update", { userId, isTyping, groupId });
      } else if (receiverId) {
        // Only emit typing if they are friends
        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(receiverId);
        const isFriend = currentUser?.following.includes(receiverId) && targetUser?.following.includes(userId);
        
        if (isFriend) {
          socket.to(receiverId).emit("typing_update", { userId, isTyping });
        }
      }
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

