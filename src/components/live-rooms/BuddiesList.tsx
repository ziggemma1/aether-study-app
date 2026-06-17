import React from 'react';
import { Bell, Users, Video } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Buddy {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  roomId?: string;
}

interface BuddiesListProps {
  buddies: Buddy[];
  onNudge: (id: string, name: string) => void;
  onJoin: (roomId: string) => void;
}

export function BuddiesList({ buddies, onNudge, onJoin }: BuddiesListProps) {
  return (
    <div className="bg-[#141A24]/60 backdrop-blur-xl border border-[#00D2FF]/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D2FF]/10 blur-[60px] pointer-events-none" />

      <h4 className="flex items-center gap-2 text-xs font-black uppercase text-white/50 tracking-[0.2em] mb-6">
        <Users size={16} className="text-[#00D2FF]" /> Active Peers
      </h4>

      <div className="space-y-4 relative z-10">
        {buddies.length > 0 ? buddies.map((buddy) => (
          <div 
            key={buddy.id} 
            className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 hover:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-[#6C5CE7] text-white font-bold overflow-hidden shadow-inner">
                  {buddy.avatar ? (
                    <img src={buddy.avatar} alt={buddy.name} className="w-full h-full object-cover" />
                  ) : (
                    buddy.name.charAt(0)
                  )}
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#141A24]",
                  buddy.status === 'online' ? "bg-[#00E5A0]" : 
                  buddy.status === 'away' ? "bg-yellow-400" : "bg-gray-500"
                )} />
              </div>
              <div>
                <span className="block text-sm font-bold text-white mb-0.5">{buddy.name}</span>
                <span className={cn(
                  "block text-[10px] uppercase tracking-widest font-bold",
                  buddy.status === 'online' ? "text-[#00E5A0]" : 
                  buddy.status === 'away' ? "text-yellow-400" : "text-white/40"
                )}>
                  {buddy.status}
                </span>
              </div>
            </div>
            
            {buddy.roomId ? (
              <button 
                onClick={() => onJoin(buddy.roomId!)} 
                className="px-4 py-2 bg-[#00D2FF]/10 hover:bg-[#00D2FF]/20 text-[#00D2FF] text-xs font-bold rounded-lg border border-[#00D2FF]/20 transition-all flex items-center gap-2"
              >
                Join <Video size={14} />
              </button>
            ) : (
              <button 
                onClick={() => onNudge(buddy.id, buddy.name)} 
                title="Send Nudge"
                className="w-10 h-10 flex items-center justify-center bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] hover:text-[#8d82f0] rounded-xl border border-[#6C5CE7]/20 transition-all active:scale-95"
              >
                <Bell size={16} />
              </button>
            )}
          </div>
        )) : (
          <div className="py-8 text-center text-white/30 text-xs font-medium">
            <Users size={32} className="mx-auto mb-3 opacity-20" />
            No buddies online right now
          </div>
        )}
      </div>
    </div>
  );
}
