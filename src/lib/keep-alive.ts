// Ping Render or target server every 10 minutes to prevent spin-down/cold-starts
// This utility is mostly relevant for free-tier deployments like Render or early-stage Cloud Run
export function startKeepAlive(url?: string) {
  if (typeof window === 'undefined') return;
  
  const targetUrl = url || import.meta.env.VITE_SOCKET_URL || window.location.origin;
  
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
