import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppContext } from '../context/AppContext';

// This URL should be your Render server URL
// Defined as VITE_SOCKET_URL in .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://aether-socket-server-17zk.onrender.com';

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
  const selectedUserRef = useRef<string | undefined>(selectedUserId);
  const selectedGroupRef = useRef<string | undefined>(selectedGroupId);
  const userRef = useRef(user);

  // Keep refs in sync
  useEffect(() => { selectedUserRef.current = selectedUserId; }, [selectedUserId]);
  useEffect(() => { selectedGroupRef.current = selectedGroupId; }, [selectedGroupId]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Initialize Socket (Once per user)
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.warn('Messaging: No auth token found in localStorage. WebSocket connection skipped.');
      return;
    }

    console.log('Messaging: Attempting to connect to', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Messaging: Socket connected successfully');
      newSocket.emit('get-unread-counts', { userId: user.id });
      
      // If we already have a selection, request history/join
      if (selectedUserRef.current) {
        newSocket.emit('load-dm-history', { withUserId: selectedUserRef.current, currentUserId: user.id });
      } else if (selectedGroupRef.current) {
        newSocket.emit('join-group-chat', { groupId: selectedGroupRef.current });
        newSocket.emit('load-group-history', { groupId: selectedGroupRef.current });
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Messaging: Connection error:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Messaging: Socket disconnected. Reason:', reason);
    });

    // Listen for DMs
    newSocket.on('receive-dm', (msg: Message) => {
      const currentSelectedUser = selectedUserRef.current;
      const currentUser = userRef.current;
      
      // If we are currently chatting with the other party (sender or recipient)
      const isCurrentChat = currentSelectedUser && (msg.fromUserId === currentSelectedUser || msg.toUserId === currentSelectedUser);
      
      if (isCurrentChat) {
        setChatMessages(prev => {
          // Prevent duplicates (especially if sender gets back their own msg)
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        
        // Mark as read only if we are the recipient
        if (msg.toUserId === currentUser?.id) {
          newSocket.emit('mark-dm-read', { fromUserId: msg.fromUserId, currentUserId: currentUser.id });
        }
      } else if (currentUser && msg.toUserId === currentUser.id) {
        // Increment unread count only if we are the recipient and NOT in the chat
        setUnreadCounts(prev => ({
          ...prev,
          [msg.fromUserId]: (prev[msg.fromUserId] || 0) + 1
        }));
      }
    });

    newSocket.on('dm-history', ({ withUserId, messages }: { withUserId: string, messages: Message[] }) => {
      if (selectedUserRef.current === withUserId) {
        setChatMessages(messages);
      }
    });

    // Listen for Group Messages
    newSocket.on('receive-group-message', (msg: Message) => {
      if (selectedGroupRef.current === msg.groupId) {
        setChatMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    newSocket.on('group-history', ({ groupId, messages }: { groupId: string, messages: Message[] }) => {
      if (selectedGroupRef.current === groupId) {
        setChatMessages(messages);
      }
    });

    // Typing Indicators
    newSocket.on('user-typing', ({ fromUserId, isTyping: typing }: { fromUserId: string, isTyping: boolean }) => {
      if (selectedUserRef.current === fromUserId) {
        setIsTyping(typing);
      }
    });

    newSocket.on('group-typing', ({ groupId, isTyping: typing }: { groupId: string, isTyping: boolean }) => {
      if (selectedGroupRef.current === groupId) {
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
  }, [user]);

  // Selection Logic (Joining rooms/Requesting history)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !user) return;

    if (selectedUserId) {
      socket.emit('load-dm-history', { withUserId: selectedUserId, currentUserId: user.id });
      socket.emit('mark-dm-read', { fromUserId: selectedUserId, currentUserId: user.id });
      setUnreadCounts(prev => ({ ...prev, [selectedUserId]: 0 }));
      setChatMessages([]); // Clear while loading
    } else if (selectedGroupId) {
      socket.emit('join-group-chat', { groupId: selectedGroupId });
      socket.emit('load-group-history', { groupId: selectedGroupId });
      setChatMessages([]); // Clear while loading
    }

    return () => {
      if (selectedGroupId) {
        socket.emit('leave-group-chat', { groupId: selectedGroupId });
      }
    };
  }, [selectedUserId, selectedGroupId, isConnected, user]);

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
