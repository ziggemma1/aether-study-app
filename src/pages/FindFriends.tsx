import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users2, 
  Search, 
  UserPlus, 
  Check, 
  X, 
  UserCheck, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

export default function FindFriends() {
  const {
    user,
    allProfiles,
    friendRequests,
    sentFriendRequests,
    sendFriendRequest,
    respondToFriendRequest
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = allProfiles.filter(p => {
    if (p.id === user?.id) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRelationshipStatus = (targetId: string) => {
    // 1. Check if already friends (mutual following)
    const otherProfile = allProfiles.find(p => p.id === targetId);
    const isFriend = user?.following?.includes(targetId) && otherProfile?.following?.includes(user?.id || '');
    if (isFriend) return 'friend';

    // 2. Check if we've already sent a request that's still pending
    if (sentFriendRequests.includes(targetId)) return 'pending';

    return 'none';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500 pb-24 p-3 sm:p-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-text-main tracking-tight">Community</h1>
        <p className="text-xs sm:text-base text-text-muted">Find study partners and build your learning network.</p>
      </div>

      {/* Pending Requests Section */}
      {friendRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Pending Requests</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friendRequests.map((req) => (
              <motion.div 
                layout
                key={req.id}
                className="glass-card p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-alt rounded-full overflow-hidden border border-border">
                    {req.senderId.avatar ? (
                      <img src={req.senderId.avatar} alt={req.senderId.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                        {req.senderId.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{req.senderId.name}</p>
                    <p className="text-[11px] text-text-muted">Wants to be friends</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => respondToFriendRequest(req.id, 'accepted')}
                    className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => respondToFriendRequest(req.id, 'declined')}
                    className="w-8 h-8 rounded-lg bg-surface-alt text-text-muted flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Discovery */}
      <section className="space-y-6">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-alt/30 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm sm:text-base outline-none focus:border-primary/50 transition-all text-text-main"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((p) => {
              const status = getRelationshipStatus(p.id);
              return (
                <motion.div 
                  layout
                  key={p.id}
                  className="glass-card p-5 group hover:border-primary/30 transition-all flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-surface rounded-3xl border-4 border-surface-alt overflow-hidden mb-4 relative">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-text-main mb-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={12} className="text-secondary" />
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{p.streak} Day Streak</span>
                  </div>
                  
                  <div className="w-full mt-auto pt-4 border-t border-border/30">
                    {status === 'friend' ? (
                      <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs">
                        <UserCheck size={16} />
                        Connected
                      </div>
                    ) : status === 'pending' ? (
                      <div className="w-full py-2.5 text-xs flex items-center justify-center gap-2 text-text-muted font-bold bg-surface-alt rounded-xl cursor-default">
                        <Clock size={16} />
                        Pending
                      </div>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(p.id)}
                        className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} />
                        Add Friend
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
              <Users2 size={48} className="mb-4" />
              <p className="text-sm font-medium">No users found matching your search</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
