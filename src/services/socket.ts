import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    const origin = window.location.origin;
    socket = io(origin, {
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true,
      transports: ['websocket'], // Force websocket
      withCredentials: true
    });


    
    socket.on("connect", () => {
      console.log("Connected to real-time server");
    });

    socket.on("connect_error", (err: any) => {
      if (err.message === "xhr poll error" || err.message === "websocket error" || err.message === "timeout") {
         console.warn("Socket connection failed (likely environment restriction e.g. Vercel). Real-time features disabled.");
      } else {
         console.error("Socket connection error:", err.message);
         if (err.description) console.error("Error Description:", err.description);
         if (err.context) console.error("Error Context:", err.context);
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
