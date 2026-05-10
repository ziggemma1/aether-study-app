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
    const envUrl = (import.meta.env?.VITE_SOCKET_URL as string);
    
    // Choose target: Env var > Origin (safest fallback)
    let targetUrl = envUrl || window.location.origin;
    
    // Explicitly check for local environments to ensure we use the correct origin
    const origin = window.location.origin;
    if (!envUrl && (origin.includes("google-west1.run.app") || origin.includes("localhost") || origin.includes("webcontainer.io"))) {
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

    // Normalize protocol: https -> wss, http -> ws
    const WS_URL = targetUrl.replace(/^http/, 'ws');

    socket = io(WS_URL, {
      auth: finalToken ? { token: finalToken } : undefined,
      autoConnect: true,
      reconnection: true,
      transports: ['websocket'], // Force WebSocket transport
      withCredentials: true
    });


    
    socket.on("connect", () => {
      console.log("Connected to real-time server");
    });

    socket.on("connect_error", (err: any) => {
      // Significantly reduce noise for connection errors in restricted environments
      if (err.message === "xhr poll error" || err.message === "websocket error" || err.message === "timeout") {
         // Only log once to avoid flooding the console
         if (!(window as any)._socket_error_logged) {
           console.log("ℹ️ Real-time features restricted in this environment (Vercel/Iframe). Using standard API polling.");
           (window as any)._socket_error_logged = true;
         }
      } else {
         console.warn("Socket connection error:", err.message);
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
