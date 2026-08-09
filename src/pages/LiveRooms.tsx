import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Users, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { ActiveRoomCard, IdleRoomRow, Room } from '../components/live-rooms/RoomCard';
import { BuddiesList, Buddy } from '../components/live-rooms/BuddiesList';
import { LiveRoomView } from '../components/live-rooms/LiveRoomView';
import { useLiveRoom } from '../hooks/useLiveRoom';
import { usePresence } from '../hooks/usePresence';

export default function LiveRooms() {
  const { user, allProfiles, showToast } = useAppContext();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const { isOnline } = usePresence();

  /**
   * Busiest first, so the most alive room is the first thing read. Empty rooms
   * keep their own order and fall to the compact list below.
   */
  const activeRooms = React.useMemo(
    () => rooms.filter(r => r.activeCount > 0).sort((a, b) => b.activeCount - a.activeCount),
    [rooms]
  );
  const idleRooms = React.useMemo(() => rooms.filter(r => r.activeCount === 0), [rooms]);
  const totalStudying = React.useMemo(
    () => activeRooms.reduce((sum, r) => sum + r.activeCount, 0),
    [activeRooms]
  );

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
        activeCount: r.activeCount || 0,
        // Real occupants, populated by GET /rooms. This used to be discarded,
        // so the card could only ever show a number. It is NOT the old
        // `Array(r.activeCount).fill({ name: 'User' })` fabrication — anything
        // without a real name is dropped rather than drawn as a blank face.
        participants: Array.isArray(r.participants)
          ? r.participants
              .filter((p: any) => p && typeof p === 'object' && p.name)
              .map((p: any) => ({ id: String(p._id || p.id), name: p.name, avatar: p.avatar }))
          : [],
        maxParticipants: r.maxParticipants || 10,
        isActive: r.activeCount > 0,
        createdAt: r.createdAt || new Date().toISOString()
      }));
      setRooms(mappedRooms);
      setLoadError(null);
    } catch (err: any) {
      // Recorded, not just toasted. A 3-second toast then left the page showing
      // "It's quiet here — be the first to create a space", so a failed request
      // was indistinguishable from genuinely having no rooms.
      setLoadError(err?.response?.data?.message || 'We could not load live rooms.');
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
      showToast('Room created.', 'success');
      handleJoin(res.data._id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'We could not create that room.', 'error');
    }
  };

  const handleJoin = (roomId: string) => {
    setActiveRoomId(roomId);
    joinRoom(roomId);
    showToast('Joining room…');
  };

  const handleLeave = () => {
    if (activeRoomId) {
      leaveRoom(activeRoomId);
    }
    setActiveRoomId(null);
    showToast('You left the room.');
  };

  // Status now comes from real socket presence. It used to be
  // `Math.random() > 0.5 ? 'online' : 'away'` with a random `roomId` on top, so
  // the panel invented both who was around and who was in a room — and re-rolled
  // it on every render. `roomId` is left undefined: the server does not expose
  // which room a given user is in, and guessing it was the worse half of the bug.
  const buddies: Buddy[] = allProfiles
    .filter(p => (p.id || p._id) !== user?.id)
    .slice(0, 5)
    .map(p => ({
      id: p.id || (p as any)._id,
      name: p.name,
      avatar: p.avatar,
      status: isOnline(p.id || (p as any)._id) ? 'online' : 'offline',
      roomId: undefined
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
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
            >
              <Plus size={18} /> New room
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
              <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <Sparkles size={16} className="text-secondary" /> Discover Rooms
              </h2>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[var(--radius-card)] border border-border">
                <Loader2 size={40} className="text-primary animate-spin mb-6" />
                <p className="text-text-muted text-sm">Loading rooms…</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[var(--radius-card)] border border-border text-center px-4">
                <div className="w-20 h-20 bg-brand-pink/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={32} className="text-brand-pink" />
                </div>
                <h3 className="text-xl font-bold mb-2">We couldn't load the rooms</h3>
                <p className="text-text-muted text-sm max-w-sm mb-8">{loadError}</p>
                <button
                  onClick={fetchRooms}
                  className="px-6 py-3 bg-surface-alt hover:bg-primary/10 hover:text-primary text-text-main rounded-xl font-semibold transition-colors border border-border cursor-pointer min-h-[44px]"
                >
                  Try again
                </button>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[var(--radius-card)] border border-border text-center px-4">
                <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mb-6 border border-border">
                  <Users size={32} className="text-text-muted" />
                </div>
                <h3 className="text-xl font-bold mb-2">It's quiet here</h3>
                <p className="text-text-muted text-sm max-w-sm mb-8">Be the first to open a room and start a focus session.</p>
                {/* Was `bg-surface-alt … text-text-main`: a white label on a pale
                    chip, i.e. an invisible primary call to action. */}
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  New room
                </button>
              </div>
            ) : (
              /* Occupancy drives the layout. Busy rooms are cards in a grid;
                 empty ones collapse into a single-column list of compact rows.
                 Splitting them also kills the orphaned-card problem: an odd
                 number of rooms used to leave one card alone on the last row
                 of a 2-up grid. A single-column list cannot orphan. */
              <div className="space-y-8">
                {activeRooms.length > 0 && (
                  <section>
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h2 className="font-heading text-sm font-bold text-text-main tracking-tight">
                        Happening now
                      </h2>
                      <span className="text-xs font-semibold text-live-ink">
                        {totalStudying} studying in {activeRooms.length} {activeRooms.length === 1 ? 'room' : 'rooms'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeRooms.map(r => (
                        <ActiveRoomCard key={r.id} room={r} onJoin={handleJoin} />
                      ))}
                    </div>
                  </section>
                )}

                {idleRooms.length > 0 && (
                  <section>
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h2 className="font-heading text-sm font-bold text-text-main tracking-tight">
                        {activeRooms.length > 0 ? 'Quiet rooms' : 'Rooms'}
                      </h2>
                      <span className="text-xs text-text-muted">
                        {idleRooms.length} empty · start one and others can join
                      </span>
                    </div>
                    <div className="space-y-2">
                      {idleRooms.map(r => (
                        <IdleRoomRow key={r.id} room={r} onJoin={handleJoin} />
                      ))}
                    </div>
                  </section>
                )}
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
               className="absolute inset-0 bg-background/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative bg-surface rounded-[32px] p-8 w-full max-w-md shadow-[var(--shadow-card-hover)] border border-border overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] pointer-events-none" />
                
                <h2 className="text-2xl font-bold mb-8 tracking-tight">New room</h2>
                
                <form onSubmit={handleCreateRoom} className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2">Room name</label>
                    <input 
                      type="text" 
                      value={newRoom.name}
                      onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                      placeholder="e.g. Midnight Math Grind"
                      className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:border-primary/50 focus:bg-surface-alt outline-none transition-all text-text-main placeholder:text-text-muted font-medium text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2">Subject focus</label>
                    <select 
                      value={newRoom.subject}
                      onChange={e => setNewRoom({...newRoom, subject: e.target.value})}
                      className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:border-primary/50 focus:bg-surface-alt outline-none transition-all text-text-main font-medium text-sm appearance-none"
                    >
                      <option className="bg-surface">General</option>
                      <option className="bg-surface">Biology</option>
                      <option className="bg-surface">Computer Science</option>
                      <option className="bg-surface">History</option>
                      <option className="bg-surface">Mathematics</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-4 font-semibold text-text-main hover:bg-surface-alt rounded-2xl transition-all text-sm cursor-pointer min-h-[44px]">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all text-sm cursor-pointer min-h-[44px]">Create room</button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
