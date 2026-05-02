import { Server } from "socket.io";
import { Message } from "./models/Message.js";
import { Group } from "./models/Group.js";
import { User } from "./models/User.js";
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


  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Track active live room for this socket
    let activeLiveRoomId: string | null = null;

    // Join personal room for 1-on-1 messages
    socket.join(userId);

    // LIVE ROOMS LOGIC
    socket.on("join_live_room", async (roomId) => {
      activeLiveRoomId = roomId;
      await socket.join(`live_room:${roomId}`);
      const user = await User.findById(userId).select('name avatar');
      
      // Use fetchSockets for distributed room member tracking
      const sockets = await io.in(`live_room:${roomId}`).fetchSockets();
      const participants = [];
      
      for (const s of sockets) {
        const clientUserId = s.data.userId;
        if (clientUserId) {
          const pUser = await User.findById(clientUserId).select('name avatar');
          if (pUser) {
            participants.push({ 
              id: clientUserId.toString(), 
              name: pUser.name, 
              avatar: pUser.avatar 
            });
          }
        }
      }
      
      const uniqueParticipants = Array.from(new Map(participants.map(p => [p.id, p])).values());
      socket.emit("room_participants", { roomId, participants: uniqueParticipants });

      io.to(`live_room:${roomId}`).emit("user_joined_room", { 
        roomId, 
        user: { id: userId.toString(), name: user?.name, avatar: user?.avatar } 
      });
      console.log(`User ${userId} joined live room: ${roomId}`);
    });

    socket.on("leave_live_room", (roomId) => {
      socket.leave(`live_room:${roomId}`);
      activeLiveRoomId = null;
      io.to(`live_room:${roomId}`).emit("user_left_room", { userId, roomId });
    });

    socket.on("sync_pomodoro", (data) => {
      const { roomId, timeLeft, isPaused } = data;
      // Broadcast timer state to others in room
      socket.to(`live_room:${roomId}`).emit("timer_sync", { userId, timeLeft, isPaused });
    });

    socket.on("send_nudge", async ({ targetUserId }) => {
      const sender = await User.findById(userId).select('name');
      io.to(targetUserId).emit("received_nudge", { fromUserId: userId, fromUserName: sender?.name || 'A friend' });
    });
    // END LIVE ROOMS LOGIC

    socket.on("join_group", (groupId) => {
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

    socket.on("disconnect", () => {
      if (activeLiveRoomId) {
        io.to(`live_room:${activeLiveRoomId}`).emit("user_left_room", { userId, roomId: activeLiveRoomId });
      }
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

