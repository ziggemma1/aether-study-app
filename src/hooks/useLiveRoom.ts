import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { celebrate } from '../lib/motion';

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

const DEFAULT_POMODORO_MINUTES = 25;
const MIN_POMODORO_MINUTES = 5;
const MAX_POMODORO_MINUTES = 120;
const DURATION_STORAGE_KEY = 'live_room_pomodoro_minutes';

const readSavedDuration = () => {
  if (typeof localStorage === 'undefined') return DEFAULT_POMODORO_MINUTES;
  const saved = Math.floor(Number(localStorage.getItem(DURATION_STORAGE_KEY)));
  return saved >= MIN_POMODORO_MINUTES && saved <= MAX_POMODORO_MINUTES ? saved : DEFAULT_POMODORO_MINUTES;
};

export function useLiveRoom(roomId?: string, roomName?: string) {
  const { user, setUser, showToast, fetchAppData } = useAppContext();
  const [socket, setSocket] = useState<any>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  // The chosen round length, in minutes — remembered across rooms and visits
  // via localStorage, same as the app's other per-device preferences (e.g.
  // the study voice in StudyTimer).
  const [duration, setDurationState] = useState(readSavedDuration);
  const [timer, setTimer] = useState({ minutes: duration, seconds: 0, isRunning: false });
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
  const [isNudged, setIsNudged] = useState(false);

  // Elapsed focus time since the last save, kept in a ref so the 1s tick
  // doesn't have to depend on (and re-run against) React state. `user` is
  // also mirrored into a ref so finishSession reads the latest account state
  // even when called from a cleanup closure captured on an earlier render.
  const elapsedRef = useRef(0);
  const startTimeRef = useRef<Date | null>(null);
  const roomNameRef = useRef(roomName);
  roomNameRef.current = roomName;
  const userRef = useRef(user);
  userRef.current = user;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  /**
   * Changing the round length only makes sense while paused — yanking time
   * out from under an active focus session would just be confusing. The
   * clock itself is reset to the new length so the picker's selection is
   * reflected immediately rather than on the next completed round.
   */
  const setDuration = useCallback((minutes: number) => {
    const clamped = Math.min(MAX_POMODORO_MINUTES, Math.max(MIN_POMODORO_MINUTES, Math.floor(minutes)));
    setDurationState(clamped);
    localStorage.setItem(DURATION_STORAGE_KEY, String(clamped));
    setTimer(prev => (prev.isRunning ? prev : { minutes: clamped, seconds: 0, isRunning: false }));
  }, []);

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

  /**
   * Records whatever focus time has accrued since the last save as a real
   * `POST /sessions` — the same endpoint the Library/Detailed Notes timer
   * uses, so `touchStreak()` runs and the streak reflects study anywhere in
   * the app, not just here. Below the 1-minute floor other timers use, it's a
   * no-op: pressing play then immediately pausing shouldn't log a session.
   */
  const finishSession = useCallback(async () => {
    const elapsedSeconds = elapsedRef.current;
    elapsedRef.current = 0;
    if (elapsedSeconds < 60) return;

    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const currentUser = userRef.current;

    try {
      const { data } = await api.post('/sessions', {
        title: `Live room: ${roomNameRef.current || 'Focus session'}`,
        startTime: startTimeRef.current || new Date(),
        durationMinutes,
        type: 'study',
        completed: true
      });

      if (currentUser) {
        const extendedStreak =
          typeof data.streak === 'number' && data.streak > (currentUser.streak || 0);
        void celebrate(extendedStreak ? 'milestone' : 'win');

        setUser({
          ...currentUser,
          aetherPoints: data.aetherPoints ?? currentUser.aetherPoints,
          streak: data.streak ?? currentUser.streak,
          totalStudyTime: data.totalStudyTime ?? currentUser.totalStudyTime,
          freezeTokens: data.freezeTokens ?? currentUser.freezeTokens
        });
      }

      if (Array.isArray(data.newlyUnlockedAchievements)) {
        data.newlyUnlockedAchievements.forEach((badge: any) => {
          window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: badge }));
        });
      }

      if (fetchAppData) await fetchAppData();

      showToast(
        data.freezeUsed
          ? `Focus session saved — a streak freeze covered yesterday, ${data.freezeTokens} left.`
          : `Focus session saved — ${durationMinutes} min logged.`,
        'success'
      );
    } catch (err) {
      console.error('[LiveRoom] Failed to save focus session:', err);
    }
  }, [setUser, fetchAppData, showToast]);

  const toggleTimer = useCallback(() => {
    // Currently socket broadcast isn't fully implemented on backend, but we prepare the method
    if (socket && roomId) {
      socket.emit('toggle-timer', { roomId });
    }
    setTimer(prev => {
      const nextRunning = !prev.isRunning;
      if (nextRunning) startTimeRef.current = new Date();
      return { ...prev, isRunning: nextRunning };
    });
  }, [socket, roomId]);

  // Ticks the countdown every second while running. This was the core bug:
  // toggleTimer only ever flipped `isRunning` and nothing ever decremented
  // the clock, so pressing play looked like it worked but the timer was
  // frozen and no time was ever tracked.
  useEffect(() => {
    if (!timer.isRunning) return;

    const interval = setInterval(() => {
      elapsedRef.current += 1;
      setTimer(prev => {
        const remaining = prev.minutes * 60 + prev.seconds - 1;
        if (remaining <= 0) {
          // Full pomodoro completed — stop and reset for the next round, at
          // whatever length is currently selected (read from a ref since this
          // effect doesn't depend on `duration` — the picker is hidden while
          // running, but the completion branch still needs the live value).
          return { minutes: durationRef.current, seconds: 0, isRunning: false };
        }
        return { minutes: Math.floor(remaining / 60), seconds: remaining % 60, isRunning: true };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning]);

  // Fires once whenever the timer stops, whether that's the user pausing or
  // the countdown reaching zero on its own — both cases mean "save whatever
  // was accrued".
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (wasRunningRef.current && !timer.isRunning) {
      void finishSession();
    }
    wasRunningRef.current = timer.isRunning;
  }, [timer.isRunning, finishSession]);

  // Leaving the room (roomId changes away) or navigating off the page
  // entirely (unmount) both need the same safety-net flush, in case the user
  // never paused first.
  useEffect(() => {
    return () => {
      if (elapsedRef.current >= 60) void finishSession();
      elapsedRef.current = 0;
    };
  }, [roomId, finishSession]);

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
    duration,
    setDuration,
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
