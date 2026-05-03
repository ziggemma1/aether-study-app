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
  console.log(`[CONN] User ${socket.id} connected`);

  socket.on('join_live_room', (data) => {
    // Handle both old (roomId only) and new ({ roomId, user }) formats
    const roomId = typeof data === 'string' ? data : data.roomId;
    const clientUser = typeof data === 'object' ? data.user : null;
    
    const cleanRoomId = String(roomId).trim();
    console.log(`[ROOM] Socket ${socket.id} joining room: "${cleanRoomId}"`);
    
    socket.join(cleanRoomId);
    socket.data.roomId = cleanRoomId;
    
    // Use client provided user data or fallback to default
    socket.data.user = clientUser || {
      id: socket.id,
      name: `Student ${socket.id.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.id}`
    };

    // Immediate confirmation
    updateRoomParticipants(cleanRoomId);
    
    // Broadcast join event
    socket.to(cleanRoomId).emit('user_joined_room', { 
      roomId: cleanRoomId, 
      user: socket.data.user 
    });
  });

  socket.on('send_room_message', ({ roomId, content }) => {
    const cleanRoomId = String(roomId).trim();
    const user = socket.data.user;
    const message = {
      id: `msg_${Date.now()}`,
      roomId: cleanRoomId,
      senderId: socket.id,
      senderName: user?.name || "Anonymous",
      senderAvatar: user?.avatar || "",
      content,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[MSG] Room ${cleanRoomId}: ${message.senderName}: ${content}`);
    io.to(cleanRoomId).emit('received_room_message', message);
  });

  socket.on('send_nudge', ({ targetUserId }) => {
    const sender = socket.data.user;
    console.log(`[NUDGE] From ${sender?.name} (${socket.id}) to ${targetUserId}`);
    io.to(targetUserId).emit('received_nudge', { 
      fromUserId: socket.id, 
      fromUserName: sender?.name || 'A student' 
    });
  });

  socket.on('typing', ({ roomId }) => {
    const cleanRoomId = String(roomId).trim();
    const user = socket.data.user;
    socket.to(cleanRoomId).emit('user_typing', { 
      roomId: cleanRoomId,
      userId: socket.id,
      userName: user?.name || "Someone" 
    });
  });

  socket.on('stop_typing', ({ roomId }) => {
    const cleanRoomId = String(roomId).trim();
    socket.to(cleanRoomId).emit('user_stop_typing', { 
      roomId: cleanRoomId,
      userId: socket.id 
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[DISCONN] ${socket.id} disconnected: ${reason}`);
    const roomId = socket.data.roomId;
    if (roomId) {
      updateRoomParticipants(roomId);
      io.to(roomId).emit('user_left_room', { userId: socket.id, roomId });
    }
  });

  async function updateRoomParticipants(roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    const participants = sockets.map(s => ({
      id: s.id,
      name: s.data.user?.name || "Anonymous",
      avatar: s.data.user?.avatar || "",
      instanceId: s.id,
      isMe: false // Calculated on client
    }));
    
    console.log(`[SYNC] Room ${roomId} has ${participants.length} active sockets`);
    io.to(roomId).emit('room_participants', { roomId, participants });
  }
});

app.get('/health', (req, res) => {
  res.send('Live Room Socket Server is healthy');
});

server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});
