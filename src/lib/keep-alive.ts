// Ping Render or target server every 10 minutes to prevent spin-down/cold-starts
// This utility is mostly relevant for free-tier deployments like Render or early-stage Cloud Run
export function startKeepAlive(url?: string) {
  if (typeof window === 'undefined') return;
  
  // Same precedence rule as services/socket.ts: never reach for the deployed
  // server from a local origin. Keeping a production instance warm is not a
  // dev machine's job, and it made the console imply a remote connection.
  const origin = window.location.origin;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
  const targetUrl = url || (isLocal ? origin : (import.meta.env.VITE_SOCKET_URL || origin));
  
  console.log(`[KeepAlive] Starting heartbeat to: ${targetUrl}`);
  
  const interval = setInterval(async () => {
    try {
      // Use /health endpoint we just added
      const response = await fetch(`${targetUrl.replace(/\/$/, '')}/health`);
      if (response.ok) {
        console.log('💓 Heartbeat: Server is alive');
      } else {
        console.warn('💓 Heartbeat: Server responded with error status', response.status);
      }
    } catch (error) {
      console.warn('💓 Heartbeat: Failed to reach server', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
  
  // Return cleanup function
  return () => clearInterval(interval);
}
