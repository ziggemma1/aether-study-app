import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { useAppContext } from '../context/AppContext';

export interface RoomParticipant {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'away' | 'offline';
  isMe?: boolean;
  instanceId?: string;
  focusTime?: number;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export function useLiveRoom(roomId?: string) {
  const { user } = useAppContext();
  const [socket, setSocket] = useState<any>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [timer, setTimer] = useState({ minutes: 25, seconds: 0, isRunning: false });
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
  const [isNudged, setIsNudged] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    if (s) {
      setIsConnected(s.connected);
      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));
    }
  }, []);

  const joinRoom = useCallback((id: string) => {
    if (socket && user) {
      socket.emit('join_live_room', { 
        roomId: id, 
        user: {
          id: user.id || (user as any)._id,
          name: user.name,
          avatar: user.avatar
        } 
      });
    }
  }, [socket, user]);

  const leaveRoom = useCallback((id: string) => {
    if (socket) {
      socket.emit('leave_live_room', id);
      setParticipants([]);
      setMessages([]);
    }
  }, [socket]);

  const toggleTimer = useCallback(() => {
    // Currently socket broadcast isn't fully implemented on backend, but we prepare the method
    if (socket && roomId) {
      socket.emit('toggle-timer', { roomId });
    }
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, [socket, roomId]);

  const sendMessage = useCallback((text: string) => {
    if (socket && roomId && text.trim()) {
      socket.emit("send_room_message", {
        roomId,
        content: text.trim()
      });
    }
  }, [socket, roomId]);

  const nudgeUser = useCallback((userId: string) => {
    if (socket) {
      socket.emit('send_nudge', { targetUserId: userId });
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user_joined_room", (data: { user: RoomParticipant, roomId: string }) => {
      const incomingId = String(data.user.id || (data.user as any)._id);
      const currentUserId = String(user?.id || (user as any)?._id || '');
      
      const pName = data.user.name || 'Anonymous';
      const normalizedUser: RoomParticipant = {
        ...data.user,
        id: incomingId,
        name: pName,
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pName}-${incomingId}`,
        instanceId: (data.user as any).instanceId,
        isMe: incomingId === currentUserId,
        status: 'online'
      };

      setParticipants(prev => {
        const instanceId = normalizedUser.instanceId;
        if (instanceId && prev.find(p => p.instanceId === instanceId)) return prev;
        if (!instanceId && prev.find(p => String(p.id) === incomingId)) return prev;
        return [...prev, normalizedUser];
      });

      if (incomingId !== currentUserId) {
        setMessages(prev => [...prev, {
          id: `sys_${Date.now()}_join_${incomingId}`,
          roomId: data.roomId,
          senderId: 'system',
          senderName: 'System',
          senderAvatar: '',
          content: `${pName} joined focusing session`,
          timestamp: new Date().toISOString()
        }].slice(-50));
      }
    });

    socket.on("room_participants", (data: { roomId: string, participants: RoomParticipant[] }) => {
      if (roomId && data.roomId !== roomId) return;
      
      const currentUserId = String(user?.id || (user as any)?._id || '');
      const normalized: RoomParticipant[] = data.participants.map(p => {
        const pId = String(p.id || (p as any)._id);
        const pName = p.name || 'Anonymous';
        return {
          ...p,
          id: pId,
          name: pName,
          avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pName}-${pId}`,
          isMe: pId === currentUserId,
          instanceId: (p as any).instanceId,
          status: 'online',
          focusTime: Math.floor(Math.random() * 60) // Mocking focus time for demo
        };
      });
      setParticipants(normalized);
    });

    socket.on("user_left_room", (data: { userId: string, roomId: string, instanceId?: string }) => {
      const leftUserId = String(data.userId);
      const leftInstanceId = data.instanceId;
      
      setParticipants(prev => {
        const leftUser = prev.find(p => (leftInstanceId && p.instanceId === leftInstanceId) || (!leftInstanceId && String(p.id) === leftUserId));
        if (leftUser) {
           setMessages(prevMsgs => [...prevMsgs, {
             id: `sys_${Date.now()}_leave_${leftUserId}`,
             roomId: data.roomId,
             senderId: 'system',
             senderName: 'System',
             senderAvatar: '',
             content: `${leftUser.name} left the session`,
             timestamp: new Date().toISOString()
           }].slice(-50));
        }
        if (leftInstanceId) {
          return prev.filter(p => p.instanceId !== leftInstanceId);
        }
        return prev.filter(p => String(p.id) !== leftUserId);
      });
    });

    socket.on("received_nudge", (data: { fromUserId: string, fromUserName?: string }) => {
      setIsNudged(true);
      setTimeout(() => setIsNudged(false), 500);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
    });

    socket.on("received_room_message", (message: RoomMessage) => {
      if (roomId && message.roomId !== roomId) return;
      setMessages(prev => [...prev, message].slice(-50));
    });

    socket.on("user_typing", (data: { userId: string, userName: string }) => {
      setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName }));
    });

    socket.on("user_stop_typing", (data: { userId: string }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    return () => {
      socket.off("user_joined_room");
      socket.off("room_participants");
      socket.off("user_left_room");
      socket.off("received_nudge");
      socket.off("received_room_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [socket, user, roomId]);

  // Provide notifyTyping helper
  const notifyTyping = useCallback(() => {
    if (socket && roomId) {
      socket.emit("typing", { roomId });
      // auto stop typing after 2 seconds
      setTimeout(() => {
        socket.emit("stop_typing", { roomId });
      }, 2000);
    }
  }, [socket, roomId]);

  return {
    participants,
    timer,
    messages,
    isConnected,
    isNudged,
    typingUsers,
    joinRoom,
    leaveRoom,
    toggleTimer,
    sendMessage,
    nudgeUser,
    notifyTyping
  };
}
