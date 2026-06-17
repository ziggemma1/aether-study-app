import React from 'react';
import { motion } from 'motion/react';
import { Crown, Zap, BookOpen, CheckCircle, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  subject?: string;
  points: {
    total: number;
    studyTime: number;
    quizzes: number;
    streak: number;
  };
}

interface LeaderboardCardProps {
  rank: number;
  user: LeaderboardUser;
  isCurrentUser: boolean;
  index: number;
}

export function LeaderboardCard({ rank, user, isCurrentUser, index }: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: <Crown className="text-amber-400" />, bg: "bg-amber-400/10", border: "border-amber-400/30", text: "text-amber-400" };
    if (rank === 2) return { icon: <span className="text-slate-300">🥈</span>, bg: "bg-slate-400/10", border: "border-slate-400/30", text: "text-slate-300" };
    if (rank === 3) return { icon: <span className="text-amber-700">🥉</span>, bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-700" };
    return { icon: <span className="text-white/40">#{rank}</span>, bg: "bg-white/5", border: "border-white/5", text: "text-white/40" };
  };

  const style = getRankStyle(rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300",
        isCurrentUser 
          ? "bg-[#6C5CE7]/10 border-[#6C5CE7]/40 shadow-[0_0_30px_rgba(108,92,231,0.15)] ring-1 ring-[#6C5CE7]/20" 
          : "bg-[#141A24]/60 border-white/5 hover:border-white/10 hover:bg-[#141A24]/80",
        "mb-3"
      )}
    >
      {/* Rank Indicator */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm",
        style.bg,
        style.border,
        style.text
      )}>
        {style.icon}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <div className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center bg-[#6C5CE7] text-white font-bold overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00D2FF] rounded-full border-2 border-[#141A24] flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm truncate flex items-center gap-2">
            {user.name}
            {isCurrentUser && (
              <span className="text-[9px] font-black uppercase text-[#6C5CE7] bg-[#6C5CE7]/10 px-1.5 py-0.5 rounded border border-[#6C5CE7]/20">
                You
              </span>
            )}
          </h4>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5 truncate">
            {user.subject || 'All Subjects'}
          </p>
        </div>
      </div>

      {/* Points Section */}
      <div className="text-right flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5 font-mono text-lg font-black text-white">
          <Zap size={14} className="text-[#00D2FF]" fill="currentColor" />
          {user.points.total.toLocaleString()}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-tighter">
            <BookOpen size={10} /> {user.points.studyTime}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-tighter">
            <CheckCircle size={10} /> {user.points.quizzes}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-[#FF7675] uppercase tracking-tighter">
            <Flame size={10} /> {user.points.streak}
          </div>
        </div>
      </div>

      {/* Hover Background Detail */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}
