import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getSocket } from '../services/socket';
import api from '../services/api';

/**
 * Chat for the Messages page.
 *
 * The previous version spoke a protocol that did not exist. It emitted
 * `send-dm`, `send-group-message`, `load-dm-history`, `load-group-history`,
 * `join-group-chat`, `mark-dm-read`, `get-unread-counts`, `typing-dm` and
 * `typing-group`, and listened for `receive-dm`, `dm-history`,
 * `receive-group-message`, `group-history`, `user-typing`, `group-typing` and
 * `unread-counts` — **seventeen events, none of which the server implements.**
 * The server speaks `send_message` / `typing` / `join_group` and replies with
 * `new_message` / `typing_update` / `error_message`.
 *
 * So no message was ever sent, no history ever loaded, and no message ever
 * arrived. The page looked complete and did nothing.
 *
 * It also opened a SECOND socket connection of its own, on top of the shared
 * one in services/socket.ts, so every signed-in client held two authenticated
 * sockets. This uses the shared one.
 *
 * History comes over REST — GET /messages already existed and worked, and is a
 * better fit than a socket round-trip for a one-shot fetch.
 */

/** What the server stores. */
interface StoredMessage {
  _id?: string;
  id?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  isRead?: boolean;
  createdAt: string;
}

/** What the UI renders. */
export interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId?: string;
  groupId?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

/**
 * The two shapes never matched either: the page read `fromUserId`, `text` and
 * `timestamp` off documents that carry `senderId`, `content` and `createdAt`,
 * so even a delivered message would have rendered as an empty bubble.
 */
function toChatMessage(m: StoredMessage): ChatMessage {
  return {
    id: String(m._id || m.id || `${m.senderId}-${m.createdAt}`),
    fromUserId: String(m.senderId),
    toUserId: m.receiverId ? String(m.receiverId) : undefined,
    groupId: m.groupId ? String(m.groupId) : undefined,
    text: m.content,
    timestamp: m.createdAt || new Date().toISOString(),
    isRead: !!m.isRead
  };
}

export const useMessaging = (selectedUserId?: string, selectedGroupId?: string) => {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const selectedUserRef = useRef(selectedUserId);
  const selectedGroupRef = useRef(selectedGroupId);
  useEffect(() => { selectedUserRef.current = selectedUserId; }, [selectedUserId]);
  useEffect(() => { selectedGroupRef.current = selectedGroupId; }, [selectedGroupId]);

  // --- Live connection ---
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onNewMessage = (raw: StoredMessage) => {
      const msg = toChatMessage(raw);
      const inThisDm =
        selectedUserRef.current &&
        !msg.groupId &&
        (msg.fromUserId === selectedUserRef.current || msg.toUserId === selectedUserRef.current);
      const inThisGroup = selectedGroupRef.current && msg.groupId === selectedGroupRef.current;
      if (!inThisDm && !inThisGroup) return;

      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const onTyping = (data: { userId: string; isTyping: boolean; groupId?: string }) => {
      const relevant = data.groupId
        ? data.groupId === selectedGroupRef.current
        : data.userId === selectedUserRef.current;
      if (relevant) setIsTyping(data.isTyping);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('typing_update', onTyping);

    return () => {
      // Pass the handler: `socket.off('new_message')` with no second argument
      // strips every listener on the shared socket, including AppContext's.
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('typing_update', onTyping);
    };
  }, [user]);

  // --- History for the open conversation ---
  useEffect(() => {
    if (!user || (!selectedUserId && !selectedGroupId)) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsTyping(false);

    const params = selectedGroupId ? { groupId: selectedGroupId } : { receiverId: selectedUserId };

    api.get('/messages', { params })
      .then((res) => {
        if (cancelled) return;
        setMessages((res.data || []).map(toChatMessage));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || "We couldn't load this conversation.");
        setMessages([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Joining the group room is what makes its live messages arrive at all.
    const socket = getSocket();
    if (socket && selectedGroupId) socket.emit('join_group', selectedGroupId);

    return () => { cancelled = true; };
  }, [user, selectedUserId, selectedGroupId]);

  const sendMessage = useCallback((text: string) => {
    const socket = getSocket();
    if (!socket || !user || !text.trim()) return;
    if (selectedGroupId) {
      socket.emit('send_message', { content: text, groupId: selectedGroupId });
    } else if (selectedUserId) {
      socket.emit('send_message', { content: text, receiverId: selectedUserId });
    }
  }, [user, selectedUserId, selectedGroupId]);

  const setTypingStatus = useCallback((typing: boolean) => {
    const socket = getSocket();
    if (!socket || !user) return;
    if (selectedGroupId) socket.emit('typing', { isTyping: typing, groupId: selectedGroupId });
    else if (selectedUserId) socket.emit('typing', { isTyping: typing, receiverId: selectedUserId });
  }, [user, selectedUserId, selectedGroupId]);

  return { messages, loading, error, isTyping, isConnected, sendMessage, setTypingStatus };
};
