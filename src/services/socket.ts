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
    const DEFAULT_RENDER_URL = "https://aether-socket-server-17zk.onrender.com";
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    
    // Choose target: Env var > Render Fallback (if not local) > Origin
    let targetUrl = envUrl || DEFAULT_RENDER_URL;
    
    // If we're in the AI Studio preview environment and no URL is set, we use origin (local server)
    const origin = window.location.origin;
    if (!envUrl && (origin.includes("google-west1.run.app") || origin.includes("localhost"))) {
      targetUrl = origin;
    }

    // Try to get token from localStorage first, then cookies
    let finalToken = token;
    if (!finalToken) {
      finalToken = localStorage.getItem('auth_token') || undefined;
    }
    
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
