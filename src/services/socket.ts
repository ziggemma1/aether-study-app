import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    const origin = window.location.origin;
    socket = io(origin, {
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true,
      transports: ['polling', 'websocket'], // Allow fallback to polling
      withCredentials: true
    });


    
    socket.on("connect", () => {
      console.log("Connected to real-time server");
    });

    socket.on("connect_error", (err: any) => {
      console.error("Socket connection error:", err.message);
      if (err.description) {
        console.error("Error Description:", err.description);
      }
      if (err.context) {
        console.error("Error Context:", err.context);
      }
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
