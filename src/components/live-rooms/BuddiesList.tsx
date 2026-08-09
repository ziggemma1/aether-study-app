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
    <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]">

      <h4 className="flex items-center gap-2 text-sm font-semibold mb-5">
        <Users size={16} className="text-primary" /> Study buddies
      </h4>

      <div className="space-y-4 relative z-10">
        {buddies.length > 0 ? buddies.map((buddy) => (
          <div 
            key={buddy.id} 
            className="flex items-center justify-between gap-3 p-3 bg-surface-alt rounded-xl transition-colors border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-primary text-white font-bold overflow-hidden shadow-inner">
                  {buddy.avatar ? (
                    <img src={buddy.avatar} alt={buddy.name} className="w-full h-full object-cover" />
                  ) : (
                    buddy.name.charAt(0)
                  )}
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface",
                  buddy.status === 'online' ? "bg-accent" : "bg-text-muted/40"
                )} />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-text-main truncate">{buddy.name}</span>
                <span className={cn(
                  "block text-[11px] font-medium",
                  buddy.status === 'online' ? "text-accent" : "text-text-muted"
                )}>
                  {buddy.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            {buddy.roomId ? (
              <button 
                onClick={() => onJoin(buddy.roomId!)} 
                className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-lg border border-secondary/20 transition-all flex items-center gap-2"
              >
                Join <Video size={14} />
              </button>
            ) : (
              <button 
                onClick={() => onNudge(buddy.id, buddy.name)} 
                title={`Nudge ${buddy.name}`}
                className="w-10 h-10 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary rounded-xl border border-primary/20 transition-all active:scale-95"
              >
                <Bell size={16} />
              </button>
            )}
          </div>
        )) : (
          <div className="py-8 text-center text-text-muted text-xs font-medium">
            <Users size={32} className="mx-auto mb-3 opacity-20" />
            No study buddies yet
          </div>
        )}
      </div>
    </div>
  );
}
