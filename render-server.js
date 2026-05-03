import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

// CORS for Vercel Frontend
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// In-memory storage for room participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_live_room', (roomId) => {
    socket.join(roomId);
    
    // Basic user object for testing
    const user = {
      id: socket.id,
      name: `User ${socket.id.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.id}`
    };
    
    socket.data.user = user;
    socket.data.roomId = roomId;

    console.log(`${user.name} joined room ${roomId}`);

    // Update and broadcast room participants
    updateRoomParticipants(roomId);
    
    // Broadcast join notification
    socket.to(roomId).emit('user_joined_room', { roomId, user });
  });

  socket.on('send_room_message', ({ roomId, content }) => {
    const user = socket.data.user;
    const message = {
      id: `msg_${Date.now()}`,
      senderId: socket.id,
      senderName: user?.name || "Anonymous",
      senderAvatar: user?.avatar || "",
      content,
      timestamp: new Date().toISOString()
    };
    
    io.to(roomId).emit('received_room_message', message);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      updateRoomParticipants(roomId);
      io.to(roomId).emit('user_left_room', { userId: socket.id, roomId });
    }
    console.log('User disconnected:', socket.id);
  });

  async function updateRoomParticipants(roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    const participants = sockets.map(s => ({
      id: s.id,
      name: s.data.user?.name || "Anonymous",
      avatar: s.data.user?.avatar || "",
      instanceId: s.id
    }));
    
    io.to(roomId).emit('room_participants', { roomId, participants });
  }
});

app.get('/health', (req, res) => {
  res.send('Live Room Socket Server is healthy');
});

server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});
