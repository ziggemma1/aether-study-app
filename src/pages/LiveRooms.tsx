import React, { useState, useEffect } from 'react';
import { Plus, Users, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { RoomCard, Room } from '../components/live-rooms/RoomCard';
import { BuddiesList, Buddy } from '../components/live-rooms/BuddiesList';
import { LiveRoomView } from '../components/live-rooms/LiveRoomView';
import { useLiveRoom } from '../hooks/useLiveRoom';

export default function LiveRooms() {
  const { user, allProfiles, showToast } = useAppContext();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', subject: 'General', maxParticipants: 10 });
  
  const {
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
  } = useLiveRoom(activeRoomId || undefined);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/rooms');
      const mappedRooms: Room[] = res.data.map((r: any) => ({
        id: r._id,
        name: r.name,
        subject: r.topic || 'General',
        participants: Array(r.activeCount).fill({ name: 'User' }), // Fallback display
        maxParticipants: r.maxParticipants || 10,
        isActive: r.activeCount > 0,
        createdAt: r.createdAt || new Date().toISOString()
      }));
      setRooms(mappedRooms);
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
      const res = await api.post('/rooms', { name: newRoom.name, topic: newRoom.subject, maxParticipants: newRoom.maxParticipants });
      fetchRooms(); // Refresh
      setIsCreating(false);
      setNewRoom({ name: '', subject: 'General', maxParticipants: 10 });
      showToast('Room created successfully!', 'success');
      handleJoin(res.data._id);
    } catch (err) {
      showToast('Failed to create room', 'error');
    }
  };

  const handleJoin = (roomId: string) => {
    setActiveRoomId(roomId);
    joinRoom(roomId);
    showToast('Entering Live Room...');
  };

  const handleLeave = () => {
    if (activeRoomId) {
      leaveRoom(activeRoomId);
    }
    setActiveRoomId(null);
    showToast('Left Live Room');
  };

  const buddies: Buddy[] = allProfiles
    .filter(p => (p.id || p._id) !== user?.id)
    .slice(0, 5)
    .map(p => ({
      id: p.id || (p as any)._id,
      name: p.name,
      avatar: p.avatar,
      status: Math.random() > 0.5 ? 'online' : 'away',
      roomId: Math.random() > 0.8 ? rooms[0]?.id : undefined
    }));

  const activeRoomData = rooms.find(r => r.id === activeRoomId) || { name: 'Study Session', subject: 'General' };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 relative select-none">
      {!activeRoomId && (
        <PageHeader 
          title="Live Rooms"
          subtitle="Real-time collaborative study spaces. Connect, focus, and thrive together."
          action={
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white text-sm font-bold rounded-xl shadow-[0_4px_20px_rgba(108,92,231,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus size={18} /> New Room
            </button>
          }
        />
      )}

      {activeRoomId ? (
        <LiveRoomView 
          roomName={activeRoomData.name}
          participants={participants}
          messages={messages}
          timer={timer}
          isConnected={isConnected}
          typingUsers={typingUsers}
          isNudged={isNudged}
          currentUserId={user?.id || (user as any)?._id}
          onLeave={handleLeave}
          onSendNudge={nudgeUser}
          onSendMessage={sendMessage}
          onToggleTimer={toggleTimer}
          onTyping={notifyTyping}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={16} className="text-[#00D2FF]" /> Discover Rooms
              </h2>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-[#141A24]/40 rounded-[32px] border border-white/5 backdrop-blur-md">
                <Loader2 size={40} className="text-[#6C5CE7] animate-spin mb-6" />
                <p className="text-white/40 font-bold tracking-widest uppercase text-xs">Finding active frequencies...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-[#141A24]/40 rounded-[32px] border border-white/5 backdrop-blur-md text-center px-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Users size={32} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">It's quiet here</h3>
                <p className="text-white/40 text-sm max-w-sm mb-8">Be the first to create a space and start a collaborative focus session.</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors border border-white/10"
                >
                  Create a Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map(r => (
                  <RoomCard key={r.id} room={r} onJoin={handleJoin} />
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <BuddiesList 
              buddies={buddies} 
              onNudge={(id, name) => {
                nudgeUser(id);
                showToast(`Nudged ${name}! 🔔`);
              }}
              onJoin={handleJoin}
            />
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsCreating(false)}
               className="absolute inset-0 bg-[#0B0E14]/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative bg-[#141A24] rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-white/10 overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C5CE7]/10 blur-[80px] pointer-events-none" />
                
                <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Launch Session</h2>
                
                <form onSubmit={handleCreateRoom} className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Room Name</label>
                    <input 
                      type="text" 
                      value={newRoom.name}
                      onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                      placeholder="e.g. Midnight Math Grind"
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:border-[#6C5CE7]/50 focus:bg-white/5 outline-none transition-all text-white placeholder:text-white/20 font-bold text-sm shadow-inner"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Subject focus</label>
                    <select 
                      value={newRoom.subject}
                      onChange={e => setNewRoom({...newRoom, subject: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:border-[#6C5CE7]/50 focus:bg-white/5 outline-none transition-all text-white font-bold text-sm shadow-inner appearance-none"
                    >
                      <option className="bg-[#141A24]">General</option>
                      <option className="bg-[#141A24]">Biology</option>
                      <option className="bg-[#141A24]">Computer Science</option>
                      <option className="bg-[#141A24]">History</option>
                      <option className="bg-[#141A24]">Mathematics</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-4 font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-sm">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] hover:opacity-90 active:scale-[0.98] text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(108,92,231,0.3)] transition-all text-sm">Create Space</button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
