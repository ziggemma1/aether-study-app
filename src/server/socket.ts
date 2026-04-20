import { Server } from "socket.io";
import { Message } from "./models/Message.js";
import { Group } from "./models/Group.js";
import { User } from "./models/User.js";
import jwt from "jsonwebtoken";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? [
            "https://ais-pre-ucscs5qurjgdfp2tmh76g3-315565043915.europe-west1.run.app",
            "https://ais-dev-ucscs5qurjgdfp2tmh76g3-315565043915.europe-west1.run.app"
          ] 
        : true,
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
      (socket as any).userId = decoded.id;
      next();
    } catch (err) {
      console.error("Socket Auth Error:", (err as Error).message);
      next(new Error("Authentication error: Token invalid"));
    }
  });


  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId}`);

    // Join personal room for 1-on-1 messages
    socket.join(userId);

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


        if (groupId) {
          io.to(groupId).emit("new_message", messageToSend);
        } else if (receiverId) {
          io.to(receiverId).to(userId).emit("new_message", messageToSend);
        }
      } catch (err) {
        console.error("Error sending message:", err);
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
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

