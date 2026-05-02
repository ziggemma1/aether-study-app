import { Server } from "socket.io";
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


  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Track active live room for this socket
    let activeLiveRoomId: string | null = null;

    // Join personal room for 1-on-1 messages
    socket.join(userId);

    // LIVE ROOMS LOGIC
    socket.on("join_live_room", async (roomId) => {
      try {
        const roomName = `live_room:${roomId}`;
        activeLiveRoomId = roomId;
        await socket.join(roomName);
        
        let user = socket.data.user;
        if (!user) {
          user = await User.findById(userId).select('name avatar');
          socket.data.user = user;
        }
        
        // Fetch all sockets in this room to get current participants
        const sockets = await io.in(roomName).fetchSockets();
        const participantsMap = new Map();
        
        for (const s of sockets) {
          const pUserId = s.data.userId;
          if (!pUserId) continue;
          
          let pUser = s.data.user;
          if (!pUser) {
            pUser = await User.findById(pUserId).select('name avatar');
            s.data.user = pUser;
          }
          
          if (pUser) {
            participantsMap.set(pUserId.toString(), {
              id: pUserId.toString(),
              name: pUser.name,
              avatar: pUser.avatar
            });
          }
        }
        
        const participants = Array.from(participantsMap.values());
        
        // Update room active count in DB
        try {
          await Room.findByIdAndUpdate(roomId, { 
            activeCount: participants.length,
            $addToSet: { participants: userId } 
          });
        } catch (dbErr) {
          console.error("DB Room Update Error:", dbErr);
        }
        
        // Send current list to the new joiner
        socket.emit("room_participants", { roomId, participants });
  
        // Notify others that someone joined
        io.to(roomName).emit("user_joined_room", { 
          roomId, 
          user: { id: userId.toString(), name: user?.name, avatar: user?.avatar } 
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
        io.to(roomName).emit("user_left_room", { userId, roomId });
        
        // Update room active count in DB
        const sockets = await io.in(roomName).fetchSockets();
        await Room.findByIdAndUpdate(roomId, { 
          activeCount: sockets.length,
          $pull: { participants: userId }
        });
      } catch (err) {
        console.error("Leave room error:", err);
      }
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

    socket.on("disconnect", async () => {
      if (activeLiveRoomId) {
        const roomId = activeLiveRoomId;
        const roomName = `live_room:${roomId}`;
        io.to(roomName).emit("user_left_room", { userId, roomId });
        
        // Update count
        try {
          const sockets = await io.in(roomName).fetchSockets();
          await Room.findByIdAndUpdate(roomId, { 
            activeCount: sockets.length,
            $pull: { participants: userId }
          });
        } catch (err) {
          console.error("Disconnect room update error:", err);
        }
      }
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

