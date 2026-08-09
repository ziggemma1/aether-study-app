import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Who is in a Live Room right now, for the dashboard rail.
 *
 * Presence is real: socket.ts rewrites `Room.activeCount` and
 * `Room.participants` on every join, leave and disconnect, so GET /rooms is a
 * current view rather than a cached guess. Nothing here invents a number — if
 * the rooms are empty the rail says so.
 */

export interface LivePerson {
  id: string;
  name: string;
  avatar?: string;
  roomId: string;
  roomName: string;
}

export interface LiveRoomSummary {
  id: string;
  name: string;
  topic: string;
  activeCount: number;
}

const POLL_MS = 30_000;

export function useLivePresence() {
  const [people, setPeople] = useState<LivePerson[]>([]);
  const [busiestRoom, setBusiestRoom] = useState<LiveRoomSummary | null>(null);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      const rooms = Array.isArray(res.data) ? res.data : [];

      const flat: LivePerson[] = [];
      let total = 0;
      let busiest: LiveRoomSummary | null = null;

      for (const room of rooms) {
        const roomId = room._id || room.id;
        const count = Number(room.activeCount) || 0;
        total += count;

        if (count > 0 && (!busiest || count > busiest.activeCount)) {
          busiest = { id: roomId, name: room.name, topic: room.topic, activeCount: count };
        }

        for (const p of room.participants || []) {
          // Populated docs only — an unpopulated ObjectId has no name and
          // would render as a blank chip.
          if (!p || typeof p !== 'object' || !p.name) continue;
          flat.push({
            id: String(p._id || p.id),
            name: p.name,
            avatar: p.avatar,
            roomId,
            roomName: room.name
          });
        }
      }

      setPeople(flat);
      setTotalActive(total);
      setBusiestRoom(busiest);
    } catch {
      // A failed poll leaves the last good value in place rather than
      // flashing an empty state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { people, totalActive, busiestRoom, loading, refresh: load };
}
