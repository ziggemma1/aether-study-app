import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppContext } from '../context/AppContext';

// This URL should be your Render server URL
// Defined as VITE_SOCKET_URL in .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export interface Message {
  _id: string;
  fromUserId: string;
  toUserId?: string;
  groupId?: string;
  fromUserName?: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export const useMessaging = (selectedUserId?: string, selectedGroupId?: string) => {
  const { user } = useAppContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket
  useEffect(() => {
    if (!user) return;

    // Get token from cookies
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    const token = match ? match[2] : null;

    if (!token) {
      console.warn('Messaging: No auth token found in cookies');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Messaging: Socket connected');
      newSocket.emit('get-unread-counts', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Messaging: Socket disconnected');
    });

    // Listen for DMs
    newSocket.on('receive-dm', (msg: Message) => {
      // If we are currently chatting with this user, add to messages
      if (selectedUserId && msg.fromUserId === selectedUserId) {
        setChatMessages(prev => [...prev, msg]);
        newSocket.emit('mark-dm-read', { fromUserId: selectedUserId, currentUserId: user.id });
      } else {
        // Increment unread count
        setUnreadCounts(prev => ({
          ...prev,
          [msg.fromUserId]: (prev[msg.fromUserId] || 0) + 1
        }));
      }
    });

    newSocket.on('dm-sent', (msg: Message) => {
      setChatMessages(prev => [...prev, msg]);
    });

    newSocket.on('dm-history', (history: Message[]) => {
      setChatMessages(history);
    });

    // Listen for Group Messages
    newSocket.on('receive-group-message', (msg: Message) => {
      if (selectedGroupId && msg.groupId === selectedGroupId) {
        setChatMessages(prev => [...prev, msg]);
      }
    });

    newSocket.on('group-history', ({ groupId, messages }: { groupId: string, messages: Message[] }) => {
      if (selectedGroupId === groupId) {
        setChatMessages(messages);
      }
    });

    // Typing Indicators
    newSocket.on('user-typing', ({ fromUserId, isTyping: typing }: { fromUserId: string, isTyping: boolean }) => {
      if (selectedUserId === fromUserId) {
        setIsTyping(typing);
      }
    });

    newSocket.on('group-typing', ({ groupId, isTyping: typing }: { groupId: string, isTyping: boolean }) => {
      if (selectedGroupId === groupId) {
        setIsTyping(typing);
      }
    });

    newSocket.on('unread-counts', (counts: Record<string, number>) => {
      setUnreadCounts(counts);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, selectedUserId, selectedGroupId]);

  // Load History when selection changes
  useEffect(() => {
    if (!socket || !user) return;

    if (selectedUserId) {
      socket.emit('load-dm-history', { withUserId: selectedUserId, currentUserId: user.id });
      socket.emit('mark-dm-read', { fromUserId: selectedUserId, currentUserId: user.id });
      // Reset local unread count
      setUnreadCounts(prev => ({ ...prev, [selectedUserId]: 0 }));
    } else if (selectedGroupId) {
      socket.emit('join-group-chat', { groupId: selectedGroupId });
      socket.emit('load-group-history', { groupId: selectedGroupId });
    }

    return () => {
      if (selectedGroupId && socket) {
        socket.emit('leave-group-chat', { groupId: selectedGroupId });
      }
    };
  }, [socket, selectedUserId, selectedGroupId, user]);

  // Actions
  const sendDM = useCallback((text: string) => {
    if (!socket || !user || !selectedUserId) return;
    socket.emit('send-dm', {
      toUserId: selectedUserId,
      text,
      fromUserId: user.id,
      fromUserName: user.name
    });
  }, [socket, user, selectedUserId]);

  const sendGroupMessage = useCallback((text: string) => {
    if (!socket || !user || !selectedGroupId) return;
    socket.emit('send-group-message', {
      groupId: selectedGroupId,
      text,
      userId: user.id,
      userName: user.name
    });
  }, [socket, user, selectedGroupId]);

  const setTypingStatus = useCallback((typing: boolean) => {
    if (!socket || !user) return;
    if (selectedUserId) {
      socket.emit('typing-dm', { toUserId: selectedUserId, fromUserId: user.id, isTyping: typing });
    } else if (selectedGroupId) {
      socket.emit('typing-group', { groupId: selectedGroupId, userId: user.id, isTyping: typing });
    }
  }, [socket, user, selectedUserId, selectedGroupId]);

  return {
    chatMessages,
    unreadCounts,
    isTyping,
    isConnected,
    sendDM,
    sendGroupMessage,
    setTypingStatus
  };
};
