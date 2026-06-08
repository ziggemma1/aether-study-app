import React, { useState, useEffect, useRef } from 'react';
import { Users, Play, Radio, Bell, Video, CircleDot, UserPlus, LogOut, Plus, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { StudyTimer } from '../components/StudyTimer';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';


interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isMe?: boolean;
  instanceId?: string;
}

interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

interface RoomData {
  _id: string;
  name: string;
  topic: string;
  activeCount: number;
}

const ENCOURAGEMENTS = [
  "You've got this!",
  "Stay focused, stay sharp!",
  "Take a deep breath and keep going.",
  "Your future self will thank you!",
  "One task at a time. You're doing great!",
  "Concentration is a superpower. Use it!",
  "The grind never stops, but you're winning!",
  "Make today count!"
];

export default function LiveRooms() {
  const { user, allProfiles, showToast } = useAppContext();
  const [inRoom, setInRoom] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isNudged, setIsNudged] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', topic: 'General' });
  
  const socketRef = useRef<any>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const userRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [newJoinerPulse, setNewJoinerPulse] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      showToast('Failed to load live rooms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name) return;
    try {
      const res = await api.post('/rooms', newRoom);
      setRooms([res.data, ...rooms]);
      setIsCreating(false);
      setNewRoom({ name: '', topic: 'General' });
      showToast('Room created successfully!');
      handleJoin(res.data._id);
    } catch (err) {
      showToast('Failed to create room', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      socketRef.current = getSocket();
      
      const socket = socketRef.current;
      if (socket) {
        setIsConnected(socket.connected);

        const joinRoomIfActive = () => {
          setIsConnected(true);
          if (activeRoomIdRef.current) {
            console.log("Re-joining room after connect/reconnect:", activeRoomIdRef.current);
            socket.emit("join_live_room", activeRoomIdRef.current);
          }
        };

        const handleDisconnect = () => setIsConnected(false);

        socket.on("connect", joinRoomIfActive);
        socket.on("disconnect", handleDisconnect);

        const handleUserJoined = (data: { user: RoomParticipant, roomId: string }) => {
          console.log("User joined room event received:", data.user);
          const incomingId = String(data.user.id || (data.user as any)._id);
          const currentUserId = String(userRef.current?.id || (userRef.current as any)?._id || '');
          const pName = data.user.name || 'Anonymous';
          
          const normalizedUser: RoomParticipant = {
            ...data.user,
            id: incomingId,
            name: pName,
            avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pName}-${incomingId}`,
            instanceId: (data.user as any).instanceId,
            isMe: incomingId === currentUserId
          };

          setParticipants(prev => {
            const instanceId = normalizedUser.instanceId;
            if (instanceId && prev.find(p => (p as any).instanceId === instanceId)) return prev;
            if (!instanceId && prev.find(p => String(p.id) === incomingId)) return prev;
            return [...prev, normalizedUser];
          });
          
          if (incomingId !== currentUserId) {
            showToast(`${pName} joined the room!`);
            setNewJoinerPulse(true);
            setTimeout(() => setNewJoinerPulse(false), 2000);
            // Add system message
            const systemMsg: RoomMessage = {
              id: `sys_${Date.now()}_join`,
              roomId: data.roomId,
              senderId: 'system',
              senderName: 'System',
              senderAvatar: '',
              content: `${pName} joined focusing session`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, systemMsg].slice(-50));
          }
        };

        const handleRoomParticipants = (data: { roomId: string, participants: RoomParticipant[] }) => {
          if (data.roomId !== activeRoomIdRef.current) return;
          
          console.log("Received participants list:", data.participants);
          const currentUserId = String(userRef.current?.id || (userRef.current as any)?._id || '');
          
          const normalized: RoomParticipant[] = data.participants.map(p => {
            const pId = String(p.id || (p as any)._id);
            const pName = p.name || 'Anonymous';
            return {
              ...p,
              id: pId,
              name: pName,
              avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pName}-${pId}`,
              isMe: pId === currentUserId,
              instanceId: (p as any).instanceId
            };
          });
          
          setParticipants(normalized);
        };

        const handleUserLeft = (data: { userId: string, roomId: string, instanceId?: string }) => {
          console.log("User left room:", data.userId, data.instanceId);
          const leftUserId = String(data.userId);
          const leftInstanceId = data.instanceId;
          
          setParticipants(prev => {
            const leftUser = prev.find(p => (leftInstanceId && (p as any).instanceId === leftInstanceId) || (!leftInstanceId && String(p.id) === leftUserId));
            if (leftUser) {
               // Add system message
               const systemMsg: RoomMessage = {
                 id: `sys_${Date.now()}_leave`,
                 roomId: data.roomId,
                 senderId: 'system',
                 senderName: 'System',
                 senderAvatar: '',
                 content: `${leftUser.name} left the session`,
                 timestamp: new Date().toISOString()
               };
               setMessages(prevMsgs => [...prevMsgs, systemMsg].slice(-50));
            }
            if (leftInstanceId) {
              return prev.filter(p => (p as any).instanceId !== leftInstanceId);
            }
            return prev.filter(p => String(p.id) !== leftUserId);
          });
        };

        const handleNudge = (data: { fromUserId: string, fromUserName?: string }) => {
          const phrase = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
          showToast(`${data.fromUserName || 'A friend'} nudged you! ${phrase} 🔔`, 'success');
          
          setIsNudged(true);
          setTimeout(() => setIsNudged(false), 500);

          if (window.navigator?.vibrate) {
            window.navigator.vibrate([200, 100, 200]);
          }
        };

        const handleRoomMessage = (message: RoomMessage) => {
          if (message.roomId !== activeRoomIdRef.current) return;
          setMessages(prev => [...prev, message].slice(-50)); // Keep last 50
        };

        const handleTyping = (data: { userId: string, userName: string }) => {
          setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName }));
        };

        const handleStopTyping = (data: { userId: string }) => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[data.userId];
            return next;
          });
        };

        socket.on("user_joined_room", handleUserJoined);
        socket.on("room_participants", handleRoomParticipants);
        socket.on("user_left_room", handleUserLeft);
        socket.on("received_nudge", handleNudge);
        socket.on("received_room_message", handleRoomMessage);
        socket.on("user_typing", handleTyping);
        socket.on("user_stop_typing", handleStopTyping);

        // If socket is already connected when we register listeners, join
        if (socket.connected) {
          joinRoomIfActive();
        }

        return () => {
          socket.off("connect", joinRoomIfActive);
          socket.off("disconnect", handleDisconnect);
          socket.off("user_joined_room", handleUserJoined);
          socket.off("room_participants", handleRoomParticipants);
          socket.off("user_left_room", handleUserLeft);
          socket.off("received_nudge", handleNudge);
          socket.off("received_room_message", handleRoomMessage);
          socket.off("user_typing", handleTyping);
          socket.off("user_stop_typing", handleStopTyping);
        };
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeRoomId && socketRef.current) {
      const myInfo = user ? {
        id: user.id || (user as any)._id,
        name: user.name,
        avatar: user.avatar
      } : null;

      console.log("Emitting join_live_room for:", activeRoomId, myInfo);
      socketRef.current.emit("join_live_room", { 
        roomId: activeRoomId, 
        user: myInfo 
      });
    }
    return () => {
      if (activeRoomId && socketRef.current) {
        socketRef.current.emit("leave_live_room", activeRoomId);
      }
    };
  }, [activeRoomId, !!user]);

  const handleJoin = (roomId: string) => {
    setActiveRoomId(roomId);
    setInRoom(true);
    
    // We already have a useEffect that watches activeRoomId and user, 
    // it will handle emitting join_live_room with latest user state.
    
    showToast('Entering Live Room...');
  };

  const handleLeave = () => {
    if (socketRef.current && activeRoomId) {
      socketRef.current.emit("leave_live_room", activeRoomId);
    }
    setActiveRoomId(null);
    setInRoom(false);
    setParticipants([]);
    setMessages([]);
    showToast('Left Live Room');
  };

  const sendRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoomId || !socketRef.current) return;
    
    socketRef.current.emit("stop_typing", { roomId: activeRoomId });
    socketRef.current.emit("send_room_message", {
      roomId: activeRoomId,
      content: chatInput.trim()
    });
    setChatInput('');
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    
    if (socketRef.current && activeRoomId) {
      socketRef.current.emit("typing", { roomId: activeRoomId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop_typing", { roomId: activeRoomId });
      }, 2000);
    }
  };

  const sendNudge = (targetUserId: string, name: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_nudge", { targetUserId });
      showToast(`Nudge sent to ${name}!`);
    }
  };

  const buddies = allProfiles.filter(p => (p.id || p._id) !== user?.id).slice(0, 5);
  const activeRoom = rooms.find(r => r._id === activeRoomId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 relative select-none">
      <PageHeader 
        title="Live Rooms"
        subtitle="Focus together with other global students, share pomodoro blocks and help peers."
        action={
          !inRoom ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg border border-primary/20 hover:scale-[1.02] transition-all btn-ripple"
            >
              <Plus size={14} /> Create Room
            </button>
          ) : undefined
        }
      />

      {!inRoom ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main">Popular Public Rooms</h2>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">LIVE NOW</span>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-3xl border border-border">
                <Loader2 size={40} className="text-primary animate-spin mb-4" />
                <p className="text-text-muted">Tuning into frequencies...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 bg-surface/50 rounded-3xl border border-border">
                <p className="text-text-muted">No rooms active. Why not create one?</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map(r => (
                  <motion.div 
                    key={r._id} 
                    whileHover={{ y: -4 }}
                    className="glass-card p-5 group hover:border-red-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-text-main text-lg group-hover:text-red-500 transition-colors">{r.name}</h3>
                         <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted bg-surface-alt px-2 py-1 rounded border border-border">
                           <Users size={12} /> {r.activeCount}
                         </div>
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-black uppercase text-red-500/60 tracking-wider">#{r.topic}</span>
                      </div>
                    </div>
                    <button onClick={() => handleJoin(r._id)} className="btn-primary w-full bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20 py-3">
                      Join Room <Play size={14} className="ml-2 fill-current" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-6">
             {/* Accountability Buddies Section */}
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-text-main">Buddies</h2>
             </div>

             <div className="glass-card p-5 space-y-4">
               <p className="text-[10px] font-black uppercase text-text-muted mb-2 tracking-widest">Active Peers</p>
               {buddies.length > 0 ? buddies.map(b => (
                 <div key={b.id || (b as any)._id} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={b.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.name}`} className="w-10 h-10 rounded-full border border-border" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-main">{b.name}</div>
                        <div className="text-[10px] text-primary font-bold flex items-center gap-1">Available</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendNudge(b.id || (b as any)._id, b.name || 'Friend')} 
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" 
                      title="Send Nudge"
                    >
                      <Bell size={16} />
                    </button>
                 </div>
               )) : (
                 <div className="text-center py-8">
                   <Users size={32} className="mx-auto text-text-muted/30 mb-2" />
                   <p className="text-xs text-text-muted">No buddies online.</p>
                 </div>
               )}
               <p className="text-[10px] text-text-muted text-center pt-2 leading-relaxed">
                 Nudge buddies to help them stay on track!
               </p>
             </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: isNudged ? [0, -10, 10, -10, 10, 0] : 0
          }} 
          transition={{ duration: 0.5 }}
          className="glass-card min-h-[600px] flex flex-col overflow-hidden relative border-none"
        >
           {/* Room UI */}
           <div className="absolute inset-0 -z-10 bg-[#0f172a]" />
           <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1517842645537-4d25890771d7?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
           
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0" />
                  <div className="w-3 h-3 bg-red-500 rounded-full relative" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">{activeRoom?.name || 'Study Room'}</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{participants.length} Active | Socket: {isConnected ? 'ON' : 'OFF'}</p>
                </div>
              </div>
              <button 
                onClick={handleLeave} 
                className="px-5 py-2.5 bg-white/10 text-white hover:bg-red-500 transition-all rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10"
              >
                 <LogOut size={16} /> Leave Room
              </button>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-start relative z-10 p-6">
              <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 mt-4">
                 <AnimatePresence>
                   {participants.map((p, idx) => (
                     <motion.div 
                       key={(p as any).instanceId || p.id}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                       className="bg-black/60 aspect-video rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-2xl group ring-1 ring-white/5 shadow-2xl"
                     >
                       <div className="relative mb-2">
                         <img 
                          src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-500" 
                         />
                         {p.isMe && <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-black flex items-center justify-center"><CircleDot size={8} className="text-white" /></div>}
                       </div>
                       <span className="text-[10px] md:text-xs font-bold text-white/70">{p.name} {p.isMe ? '(You)' : ''}</span>
                       
                       {!p.isMe && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             sendNudge(p.id, p.name);
                           }}
                           className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-primary/80 active:bg-primary rounded-xl transition-all text-white/40 hover:text-white border border-white/5 shadow-2xl active:scale-90 z-20"
                           title="Nudge Friend"
                         >
                           <Bell size={14} className="animate-pulse" />
                         </button>
                       )}

                       <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-lg text-[9px] font-black text-white/50 border border-white/5 flex items-center gap-1">
                          <CircleDot size={8} className="text-green-500" /> FOCUSING
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
              </div>

              <div className="relative group mb-12">
                <div className="absolute inset-x-0 -bottom-10 h-32 bg-primary/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <StudyTimer materialId={activeRoomId ? `room:${activeRoomId}` : "room"} title="Global Pomodoro" />
                </div>
              </div>

              <div className="text-center text-white/40 max-w-sm">
                <p className="text-xs font-medium leading-relaxed italic">
                  "Every minute you spend in here connects you with learners pushing their limits."
                </p>
              </div>
           </div>

           {/* Quick Chat Overlay */}
           <div className="absolute bottom-20 left-6 right-6 h-64 pointer-events-none flex flex-col justify-end z-20">
              <div className="space-y-3 overflow-y-auto no-scrollbar pointer-events-auto p-4 mask-fade-top h-full">
                 <AnimatePresence mode="popLayout">
                   {messages.map((msg) => {
                     const isMe = msg.senderId === socketRef.current?.id;
                     const isSystem = msg.senderId === 'system';

                     if (isSystem) {
                       return (
                         <motion.div 
                           key={msg.id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex justify-center my-2"
                         >
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                             {msg.content}
                           </span>
                         </motion.div>
                       );
                     }

                     return (
                       <motion.div 
                         key={msg.id}
                         layout
                         initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.9 }}
                         animate={{ opacity: 1, x: 0, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         className={cn(
                           "flex items-start gap-2 max-w-[85%]",
                           isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                         )}
                       >
                          <img src={msg.senderAvatar} className="w-8 h-8 rounded-full border border-white/10 shrink-0 shadow-lg" alt="" />
                          <div className={cn(
                            "backdrop-blur-xl px-4 py-2.5 rounded-2xl border shadow-2xl relative group",
                            isMe 
                             ? "bg-primary/20 border-primary/20 rounded-tr-none text-right" 
                             : "bg-white/5 border-white/10 rounded-tl-none"
                          )}>
                             <div className={cn(
                               "text-[10px] font-bold mb-1 uppercase tracking-wider",
                               isMe ? "text-primary-light" : "text-primary"
                             )}>
                               {msg.senderName} 
                               <span className="ml-2 text-white/20 font-medium lowercase">
                                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                             <div className="text-sm text-white/90 leading-relaxed font-medium">
                               {msg.content}
                             </div>
                          </div>
                       </motion.div>
                     );
                   })}
                 </AnimatePresence>
                 
                 {Object.keys(typingUsers).length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest pl-10"
                   >
                      <div className="flex gap-1">
                         <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                         <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                         <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                   </motion.div>
                 )}
                 
                 <div ref={messagesEndRef} />
              </div>
           </div>
           
           <div className="px-6 py-4 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center gap-4 relative z-30">
              <button 
                onClick={() => setShowParticipants(true)}
                className={cn(
                  "p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all relative",
                  newJoinerPulse && "ring-2 ring-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all"
                )}
              >
                <Users size={20} />
                {participants.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-bold flex items-center justify-center rounded-full text-white">
                    {participants.length}
                  </div>
                )}
              </button>

              <form onSubmit={sendRoomMessage} className="flex-1 flex gap-2">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={handleChatInputChange}
                   placeholder="Say something to the room..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                 />
                 <button 
                   type="submit"
                   disabled={!chatInput.trim()}
                   className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95"
                 >
                   Send
                 </button>
              </form>

              <div className="hidden sm:flex -space-x-2">
                {participants.slice(0, 5).map(p => (
                  <img key={(p as any).instanceId || p.id} src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-8 h-8 rounded-full border-2 border-slate-900" title={p.name} />
                ))}
                {participants.length > 5 && <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">+{participants.length - 5}</div>}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                 Live sync active
              </div>
           </div>
        </motion.div>
      )}

      {/* Participants Bottom Sheet */}
      <AnimatePresence>
        {showParticipants && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowParticipants(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="relative bg-[#0f172a] rounded-t-[32px] w-full max-w-md p-6 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
             >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                   <Users size={20} className="text-primary" /> Active Members
                </h3>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-8">
                   {participants.map(p => (
                     <div key={(p as any).instanceId || p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                           <img src={p.avatar} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                           <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                 {p.name} {p.isMe && <span className="text-[10px] text-primary font-black uppercase text-xs">(You)</span>}
                              </div>
                              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Focusing
                              </div>
                           </div>
                        </div>
                        
                        {!p.isMe && (
                           <button 
                             onClick={() => sendNudge(p.id, p.name)}
                             className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 active:scale-90 transition-all"
                           >
                             <Bell size={18} />
                           </button>
                        )}
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsCreating(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-surface rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-border"
             >
                <h2 className="text-2xl font-black text-text-main mb-6">Launch New Room</h2>
                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Room Name</label>
                    <input 
                      type="text" 
                      value={newRoom.name}
                      onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                      placeholder="e.g. 3AM Med Grind"
                      className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Topic</label>
                    <select 
                      value={newRoom.topic}
                      onChange={e => setNewRoom({...newRoom, topic: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl focus:border-primary outline-none transition-all"
                    >
                      <option>General</option>
                      <option>Biology</option>
                      <option>Computer Science</option>
                      <option>History</option>
                      <option>Math</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 font-bold text-text-muted hover:bg-surface-alt rounded-xl transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Launch</button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
