import React, { useState, useEffect, useRef } from 'react';
import { Users, Play, Radio, Bell, Video, CircleDot, UserPlus, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { StudyTimer } from '../components/StudyTimer';
import { getSocket } from '../services/socket';

interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isMe?: boolean;
}

export default function LiveRooms() {
  const { user, allProfiles, showToast } = useAppContext();
  const [inRoom, setInRoom] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const socketRef = useRef<any>(null);

  const mockRooms = [
    { id: 'late-night', name: 'Late Night Med Students', active: 34, topic: 'Biology' },
    { id: 'lofi', name: 'Lofi Chill Study', active: 128, topic: 'General' },
    { id: 'pomodoro', name: 'Pomodoro 50/10', active: 56, topic: 'Engineering' }
  ];

  useEffect(() => {
    if (user) {
      socketRef.current = getSocket();
      
      const socket = socketRef.current;
      if (socket) {
        socket.on("user_joined_room", (data: { user: RoomParticipant, roomId: string }) => {
          if (data.roomId === activeRoomId) {
            setParticipants(prev => {
              if (prev.find(p => p.id === data.user.id)) return prev;
              return [...prev, data.user];
            });
            showToast(`${data.user.name} joined the room!`);
          }
        });

        socket.on("user_left_room", (data: { userId: string, roomId: string }) => {
          if (data.roomId === activeRoomId) {
            setParticipants(prev => prev.filter(p => p.id !== data.userId));
          }
        });

        socket.on("received_nudge", (data: { fromUserId: string }) => {
          const sender = allProfiles.find(p => (p.id || p._id) === data.fromUserId);
          showToast(`${sender?.name || 'A friend'} nudged you to study! 🔔`, 'success');
          // Play a small sound if possible? Browser might block.
        });

        return () => {
          socket.off("user_joined_room");
          socket.off("user_left_room");
          socket.off("received_nudge");
        };
      }
    }
  }, [user, activeRoomId, allProfiles]);

  const handleJoin = (roomId: string) => {
    setActiveRoomId(roomId);
    setInRoom(true);
    setParticipants([{ 
      id: user?.id || 'me', 
      name: user?.name || 'You', 
      avatar: user?.avatar || '', 
      isMe: true 
    }]);
    
    if (socketRef.current) {
      socketRef.current.emit("join_live_room", roomId);
    }
    showToast('Entered Live Room!');
  };

  const handleLeave = () => {
    if (socketRef.current && activeRoomId) {
      socketRef.current.emit("leave_live_room", activeRoomId);
    }
    setActiveRoomId(null);
    setInRoom(false);
    setParticipants([]);
    showToast('Left Live Room');
  };

  const sendNudge = (targetUserId: string, name: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_nudge", { targetUserId });
      showToast(`Nudge sent to ${name}!`);
    }
  };

  const buddies = allProfiles.filter(p => (p.id || p._id) !== user?.id).slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 relative">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/10">
               <Radio size={24} className="animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Live Study Rooms</h1>
          </div>
          <p className="text-text-muted font-medium">Focus together, globally. 🌏</p>
        </div>
      </header>

      {!inRoom ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main">Popular Public Rooms</h2>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">LIVE NOW</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockRooms.map(r => (
                <motion.div 
                  key={r.id} 
                  whileHover={{ y: -4 }}
                  className="glass-card p-5 group hover:border-red-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-text-main text-lg group-hover:text-red-500 transition-colors">{r.name}</h3>
                       <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted bg-surface-alt px-2 py-1 rounded border border-border">
                         <Users size={12} /> {r.active}
                       </div>
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-[10px] font-black uppercase text-red-500/60 tracking-wider">#{r.topic}</span>
                    </div>
                  </div>
                  <button onClick={() => handleJoin(r.id)} className="btn-primary w-full bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20 py-3">
                    Join Room <Play size={14} className="ml-2 fill-current" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-text-main">Buddies</h2>
               <button className="text-primary hover:underline text-xs font-bold flex items-center gap-1">
                 <UserPlus size={14} /> Add New
               </button>
             </div>

             <div className="glass-card p-5 space-y-4">
               <p className="text-[10px] font-black uppercase text-text-muted mb-2 tracking-widest">Online Friends</p>
               {buddies.length > 0 ? buddies.map(b => (
                 <div key={b.id || b._id} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={b.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.name}`} className="w-10 h-10 rounded-full border border-border" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-main">{b.name}</div>
                        <div className="text-[10px] text-primary font-bold flex items-center gap-1">Online</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendNudge(b.id || b._id, b.name || 'Friend')} 
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" 
                      title="Send Nudge"
                    >
                      <Bell size={16} />
                    </button>
                 </div>
               )) : (
                 <div className="text-center py-8">
                   <Users size={32} className="mx-auto text-text-muted/30 mb-2" />
                   <p className="text-xs text-text-muted">No friends online yet.</p>
                 </div>
               )}
               <p className="text-[10px] text-text-muted text-center pt-2 leading-relaxed">
                 Buddies can see each other's status and send "Nudges" to help stay focused!
               </p>
             </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card min-h-[600px] flex flex-col overflow-hidden relative border-none">
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
                  <h2 className="text-white font-bold text-xl">{mockRooms.find(r => r.id === activeRoomId)?.name || 'Study Room'}</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{participants.length} Active in Room</p>
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
                 {/* Video/Avatar placeholders */}
                 <AnimatePresence>
                   {participants.map((p, idx) => (
                     <motion.div 
                       key={p.id}
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
                         {idx === 0 && <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-black flex items-center justify-center"><CircleDot size={8} className="text-white" /></div>}
                       </div>
                       <span className="text-[10px] md:text-xs font-bold text-white/70">{p.name} {p.isMe ? '(You)' : ''}</span>
                       
                       {/* Status Badge */}
                       <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-lg text-[9px] font-black text-white/50 border border-white/5 flex items-center gap-1">
                          <CircleDot size={8} className={idx % 2 === 0 ? "text-green-500" : "text-amber-500"} /> FOCUSING
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
              </div>

              {/* Central Timer Display */}
              <div className="relative group mb-12">
                <div className="absolute inset-x-0 -bottom-10 h-32 bg-primary/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <StudyTimer materialId={activeRoomId || "room"} title="Global Pomodoro" />
                </div>
              </div>

              <div className="text-center text-white/40 max-w-sm">
                <p className="text-xs font-medium leading-relaxed italic">
                  "Every minute you spend in here connects you with learners pushing their limits. Study together, win together."
                </p>
              </div>
           </div>
           
           {/* Bottom Activity Bar */}
           <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-between relative z-10">
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map(p => (
                  <img key={p.id} src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-8 h-8 rounded-full border-2 border-slate-900" title={p.name} />
                ))}
                {participants.length > 5 && <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">+{participants.length - 5}</div>}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                 Live presence enabled
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}
