import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string;
  avatar: string | null;
  /** Null on a group nobody has posted in yet. */
  lastMessage: string | null;
  lastAt: string | null;
  sentByMe: boolean;
  unread: number;
  /** Mutual follow. The socket refuses non-mutual DMs, so the list says so. */
  isFriend: boolean;
}

/**
 * The real conversation list: threads that exist, ordered by recency.
 *
 * What it replaces was built entirely on the client from `allProfiles` — every
 * mutual follower, each labelled "Tap to message" with a blank timestamp and a
 * hardcoded `unread: 0` and `isTyping: false`. Nothing on it had been read from
 * a message.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations || []);
      setTotalUnread(data.totalUnread || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "We couldn't load your conversations.");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // A new message changes the list's order, its previews and its badges, so
  // refresh when one lands rather than leaving a stale list on screen.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewMessage = () => { void fetch(); };
    socket.on('new_message', onNewMessage);
    return () => { socket.off('new_message', onNewMessage); };
  }, [fetch]);

  /** Clear a thread's badge locally, then persist it. */
  const markRead = useCallback(async (fromUserId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === fromUserId ? { ...c, unread: 0 } : c)));
    setTotalUnread((prev) => {
      const conv = conversations.find((c) => c.id === fromUserId);
      return Math.max(0, prev - (conv?.unread || 0));
    });
    try {
      await api.post('/messages/read', { fromUserId });
    } catch {
      /* The badge is cosmetic; a failure here should not interrupt reading. */
    }
  }, [conversations]);

  return { conversations, totalUnread, loading, error, refetch: fetch, markRead };
}
