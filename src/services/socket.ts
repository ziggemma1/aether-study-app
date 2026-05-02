import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (socket && token && (!socket.auth || (socket.auth as any).token !== token)) {
    (socket.auth as any) = { token };
    socket.disconnect().connect();
  }

  if (socket && !socket.connected) {
    socket.connect();
  }

  if (!socket) {
    const origin = window.location.origin;
    
    // Try to get token from cookies if not provided
    let finalToken = token;
    if (!finalToken) {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) finalToken = match[2];
    }

    socket = io(origin, {
      auth: finalToken ? { token: finalToken } : undefined,
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'], // Added polling as fallback
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
