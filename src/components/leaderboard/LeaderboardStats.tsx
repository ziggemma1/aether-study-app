import React from 'react';
import { Users, Target, Trophy, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LeaderboardStatsProps {
  totalUsers: number;
  yourRank: number | null;
  topScore: number;
  weekEnding: string;
}

export function LeaderboardStats({ totalUsers, yourRank, topScore, weekEnding }: LeaderboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <StatCard 
        icon={<Users size={16} className="text-[#00D2FF]" />}
        label="Participants"
        value={totalUsers.toLocaleString()}
      />
      <StatCard 
        icon={<Target size={16} className="text-[#6C5CE7]" />}
        label="Your Rank"
        value={yourRank ? `#${yourRank}` : '--'}
        highlight={!!yourRank}
      />
      <StatCard 
        icon={<Trophy size={16} className="text-amber-400" />}
        label="Top Score"
        value={topScore.toLocaleString()}
      />
      <StatCard 
        icon={<Clock size={16} className="text-white/40" />}
        label="Resets In"
        value={weekEnding}
      />
    </div>
  );
}

function StatCard({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-2xl bg-[#141A24]/60 backdrop-blur-xl border flex flex-col gap-1.5 transition-all",
      highlight ? "border-[#6C5CE7]/30 bg-[#6C5CE7]/5" : "border-white/5"
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-black uppercase text-white/30 tracking-[0.15em]">{label}</span>
      </div>
      <div className={cn(
        "text-lg font-black tracking-tight",
        highlight ? "text-[#6C5CE7]" : "text-white"
      )}>
        {value}
      </div>
    </div>
  );
}
