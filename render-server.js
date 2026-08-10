import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initSocket } from './src/server/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 4000;

if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not defined in environment variables.");
}

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
}

/**
 * This file used to hand-roll its own Socket.IO server with its own,
 * older event protocol (`send-dm`, `send-group-message`, `join-group-chat`,
 * ...) and, critically, ZERO Live Room presence handlers — no
 * `join_live_room`/`leave_live_room`/`room_participants`/`user_joined_room`.
 * The client stopped speaking that old protocol during the messaging
 * rebuild (see aether-messaging-rebuild memory) and has only ever spoken
 * the protocol `src/server/socket.ts` implements. Whatever deploys this
 * entrypoint was therefore running a server that could never satisfy Live
 * Room occupancy, and had already-dead DM/group handlers underneath it.
 *
 * Fix: this is now the exact same socket implementation the main app runs
 * in `server.ts` — one source of truth instead of two protocols drifting
 * apart again. It needs nothing from Express here beyond the HTTP server to
 * attach to and a Mongo connection for the models it queries.
 */
const io = initSocket(server);

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
