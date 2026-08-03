import React from 'react';
import { Users, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface Room {
  id: string;
  name: string;
  subject: string;
  participants: Array<{ name: string; avatar?: string }>;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
}

interface RoomCardProps {
  room: Room;
  onJoin: (id: string) => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const { name, subject, participants, maxParticipants, isActive, createdAt } = room;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl bg-[#141A24]/60 backdrop-blur-xl border transition-all duration-300",
      isActive ? "border-[#00D2FF]/30 hover:border-[#00D2FF]/50 hover:shadow-[0_8px_30px_rgba(0,210,255,0.15)]" : "border-[#6C5CE7]/10 hover:border-[#6C5CE7]/30 hover:shadow-[0_8px_30px_rgba(108,92,231,0.1)]",
      "p-6 flex flex-col justify-between hover:-translate-y-1"
    )}>
      {/* Background Gradient Effect */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50",
        isActive ? "bg-[#00D2FF]/20" : "bg-[#6C5CE7]/20"
      )} />

      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="z-10">
            <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-[#00D2FF] transition-colors">{name}</h3>
            <p className="text-xs text-[#00D2FF]/80 font-bold uppercase tracking-widest mt-1">{subject}</p>
          </div>
          <div className="z-10 bg-black/40 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-[#00E5A0] animate-pulse" : "bg-[#4A5568]")} />
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", isActive ? "text-[#00E5A0]" : "text-[#4A5568]")}>
              {isActive ? 'Live' : 'Waiting'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end mb-8 z-10 relative">
          <div className="flex items-center">
            {participants.slice(0, 5).map((p, i) => (
              <div 
                key={i} 
                className="w-10 h-10 rounded-full border-2 border-[#0B0E14] -ml-2 first:ml-0 flex items-center justify-center bg-[#6C5CE7] text-white text-xs font-bold overflow-hidden"
                style={{ zIndex: participants.length - i }}
              >
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  p.name.charAt(0)
                )}
              </div>
            ))}
            {participants.length > 5 && (
              <div className="w-10 h-10 rounded-full border-2 border-[#0B0E14] -ml-2 bg-[#2D3436] flex items-center justify-center text-[11px] font-bold text-white" style={{ zIndex: 0 }}>
                +{participants.length - 5}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/50 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
            <Users size={14} /> {participants.length}/{maxParticipants}
          </div>
        </div>
      </div>

      <div className="z-10 flex flex-col gap-4 mt-auto">
        <button 
          onClick={() => onJoin(room.id)}
          className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] hover:opacity-90 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(108,92,231,0.3)] transition-all flex items-center justify-center gap-2"
        >
          {participants.length === 0 ? 'Start Room' : 'Join Room'} <Play size={16} className="fill-white" />
        </button>

        <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-widest text-white/30 px-1">
          <span>Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          {participants.length > 0 && <span className="text-[#00D2FF]/60 flex items-center gap-1">🎯 Active Focus</span>}
        </div>
      </div>
    </div>
  );
}
