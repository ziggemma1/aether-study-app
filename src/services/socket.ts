import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    const origin = window.location.origin;
    socket = io(origin, {
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true
    });
    
    socket.on("connect", () => {
      console.log("Connected to real-time server");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
