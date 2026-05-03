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
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://aether-socket-server-17zk.onrender.com";
    const origin = window.location.origin;
    
    // Choose which URL to use - prioritize external if provided, otherwise local origin
    const targetUrl = import.meta.env.VITE_SOCKET_URL ? SOCKET_URL : origin;

    // Try to get token from cookies if not provided
    let finalToken = token;
    if (!finalToken) {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) finalToken = match[2];
    }

    socket = io(targetUrl, {
      auth: finalToken ? { token: finalToken } : undefined,
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
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
