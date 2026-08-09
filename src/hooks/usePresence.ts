import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

/**
 * Real online presence, derived server-side from open sockets.
 *
 * Replaces the `Math.random() > 0.5 ? 'online' : 'away'` that the Live Rooms
 * buddies list used to invent — those badges were re-rolled on every render, so
 * a peer could flip between Online and Away just because something else on the
 * page changed.
 */
export function usePresence(): { onlineIds: Set<string>; isOnline: (id?: string) => boolean } {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handle = (payload: { online?: string[] }) => {
      setOnlineIds(new Set((payload?.online || []).map(String)));
    };

    socket.on('presence_update', handle);
    // Ask on mount: this component may mount long after the socket connected,
    // having missed the broadcast that fired at connection time.
    socket.emit('presence_request');

    return () => {
      socket.off('presence_update', handle);
    };
  }, []);

  return {
    onlineIds,
    isOnline: (id?: string) => (id ? onlineIds.has(String(id)) : false),
  };
}
