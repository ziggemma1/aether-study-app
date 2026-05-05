import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  TrendingUp, 
  ChevronDown, 
  Check, 
  Users,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';

// --- Styles ---
const stripeStyle = {
  backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
  backgroundSize: '10px 10px'
};

// --- Sub-components ---

export function QuizScoreCard({ score = 0, trend = 0, highest = 0, lowest = 0 }: { score?: number, trend?: number, highest?: number, lowest?: number }) {
  const { t } = useAppContext();
  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-4 sm:p-5 flex flex-col w-full aspect-square max-w-[165px] sm:max-w-[210px] mx-auto group cursor-pointer border-border shadow-soft relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-80" />
      
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">{t('avg_quiz_score')}</p>
      </div>
      
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl sm:text-3xl font-extrabold text-white tracking-tighter leading-none">{Math.round(score)}%</span>
        {trend !== 0 && (
          <span className={cn(
            "text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-sm ml-auto",
            trend > 0 ? "text-emerald-400 bg-emerald-500/20" : "text-rose-400 bg-rose-500/20"
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end space-y-3 mt-4 sm:mt-6">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70">
            <span>Peak</span>
            <span className="text-primary font-black">{highest}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${highest}%` }}
              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70">
            <span>Floor</span>
            <span className="text-orange-500 font-black">{lowest}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${lowest}%` }}
              className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TimeSpentCard({ totalMinutes = 0, trend = 0, weeklyData = [] }: { totalMinutes?: number, trend?: number, weeklyData?: { day: string, hours: number }[] }) {
  const { t } = useAppContext();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const displayTime = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` 
    : `${minutes}m`;

  const maxHours = Math.max(...weeklyData.map(d => d.hours), 0.1);
  const todayIndex = new Date().getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-4 sm:p-5 flex flex-col w-full aspect-square max-w-[165px] sm:max-w-[210px] mx-auto group cursor-pointer border-border shadow-soft relative overflow-hidden"
    >
      {/* Matching the orange/red gradient from the streak card */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-80" />
      
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">{t('total_time')}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tighter leading-none shrink-0">{displayTime}</span>
        {trend !== 0 && (
          <span className={cn(
            "text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-sm ml-auto shadow-sm",
            trend > 0 ? "text-emerald-400 bg-emerald-500/30" : "text-rose-400 bg-rose-500/30"
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end mt-4 sm:mt-6">
        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-white/80 mb-3">
          <span>Focus Metrics</span>
          <span className="text-orange-400 font-black">{weeklyData.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1)}h</span>
        </div>
        
        <div className="flex justify-between items-end gap-1.5 h-12 sm:h-20">
          {weeklyData.map((d, i) => {
            const isToday = dayNames.indexOf(d.day) === todayIndex;
            const heightPercent = (d.hours / maxHours) * 100;
            const hasData = d.hours > 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
                <span className={cn(
                  "text-[8px] font-black uppercase leading-none mb-1 transition-colors",
                  isToday ? "text-orange-400 font-black" : "text-white/30"
                )}>
                  {d.day[0]}
                </span>
                
                <div className="relative w-full flex items-end justify-center h-full">
                  {hasData && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-black whitespace-nowrap z-10 shadow-lg border border-orange-400/20">
                      {d.hours}h
                    </div>
                  )}
                  
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: hasData ? `${Math.max(heightPercent, 12)}%` : '8%' }}
                    className={cn(
                      "w-full rounded-sm transition-all duration-500",
                      hasData 
                        ? cn(
                            "bg-orange-500 border border-orange-400/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]",
                            isToday && "ring-1 ring-orange-400 ring-offset-1 ring-offset-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                          )
                        : "bg-white/5 border border-white/10 group-hover/bar:bg-white/10"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function StreakCard({ currentStreak = 0, longestStreak = 0 }: { currentStreak?: number, longestStreak?: number }) {
  const { t, studySessions } = useAppContext();
  
  // Create a fast lookup Set of normalized date strings where the user actually completed a session
  const studiedDates = new Set();
  studySessions?.forEach(session => {
    if (session.completed && session.startTime) {
      const d = new Date(session.startTime);
      const normalizedString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      studiedDates.add(normalizedString);
    }
  });

  // Calculate real current streak
  let realCurrentStreak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    if (studiedDates.has(dateStr)) {
      realCurrentStreak++;
    } else if (i === 0) {
      // today potentially okay
    } else {
      break;
    }
  }

  const finalCurrentStreak = Math.max(currentStreak, realCurrentStreak);
  const finalLongestStreak = Math.max(longestStreak, finalCurrentStreak);

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = today.getDay();
  
  const displayDays = Array.from({ length: 5 }, (_, i) => {
    const historicalIndex = (todayIndex - 4 + i + 7) % 7;
    const dateToCheck = new Date();
    dateToCheck.setDate(today.getDate() - (4 - i));
    const dateStr = dateToCheck.getFullYear() + '-' + String(dateToCheck.getMonth() + 1).padStart(2, '0') + '-' + String(dateToCheck.getDate()).padStart(2, '0');
    const isActive = studiedDates.has(dateStr) || ((4 - i) < finalCurrentStreak && studiedDates.size === 0);

    return {
      label: daysOfWeek[historicalIndex],
      active: isActive
    };
  });

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-4 sm:p-5 flex flex-col w-full aspect-square max-w-[165px] sm:max-w-[210px] mx-auto group cursor-pointer border-border shadow-soft relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-80" />
      
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">{t('weekly_streak')}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl sm:text-3xl font-extrabold text-white tracking-tighter leading-none">{finalCurrentStreak}</span>
        <span className="text-[10px] sm:text-[11px] font-black text-orange-400 uppercase tracking-widest ml-1">{t('days_label')}</span>
      </div>

      <div className="flex-1 flex flex-col justify-end mt-4 sm:mt-6">
        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70 mb-2">
          <span>Records</span>
          <span className="text-orange-400 font-black">PB: {finalLongestStreak}d</span>
        </div>
        <div className="flex justify-between items-end gap-1.5 h-10 sm:h-12">
          {displayDays.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[8px] font-black text-text-muted opacity-60 leading-none">{day.label}</span>
              <div className={cn(
                "w-full rounded-sm transition-all duration-500",
                day.active 
                  ? "bg-orange-500 h-full border border-orange-600/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]" 
                  : "bg-surface-alt h-1.5 border border-border/50"
              )} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function RankingCard({ rank = 0, total = 0, topLearnersData = [] }: { rank?: number, total?: number, topLearnersData?: { id?: string, name: string, avatar?: string }[] }) {
  const { t, user } = useAppContext();
  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-4 sm:p-5 flex flex-col w-full aspect-square max-w-[165px] sm:max-w-[210px] mx-auto group cursor-pointer border-border shadow-soft relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-primary opacity-80" />
      
      {/* Gold Flash Effect */}
      <motion.div 
        animate={{ 
          opacity: [0, 0.3, 0],
          x: ['-100%', '200%']
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          repeatDelay: 5
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent skew-x-12 pointer-events-none"
      />

      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">{t('global_rank')}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-3xl font-extrabold text-white tracking-tighter leading-none">#{rank}</span>
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-black text-emerald-400"
            >
              <TrendingUp size={10} className="inline mr-0.5" /> 2
            </motion.span>
          </div>
          <span className="text-[9px] font-medium text-white/50 tracking-tight mt-0.5 whitespace-nowrap">of {total.toLocaleString()} learners</span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-widest ml-auto">Top 2%</span>
      </div>

      <div className="flex-1 flex flex-col justify-end mt-2 sm:mt-4 overflow-hidden">
        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70 mb-2">
          <span>Rivals Leaderboard</span>
        </div>
        <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[110px] pr-1.5 -mr-1">
          {topLearnersData.map((learner, i) => {
            const isMe = learner.id === user?.id;
            return (
              <div key={i} className={cn(
                "flex items-center gap-2 p-1.5 rounded-lg border leading-none transition-colors",
                isMe ? "bg-primary/20 border-primary/40 shadow-[0_0_10px_rgba(var(--primary-rgb),0.15)]" : "bg-surface-alt/50 border-border/50"
              )}>
                <span className={cn(
                  "text-[9px] font-black w-4 text-center shrink-0",
                  i < 3 ? "text-emerald-400" : "text-text-muted"
                )}>#{i + 1}</span>
                <div className="w-5 h-5 rounded-full bg-surface border border-border overflow-hidden flex items-center justify-center text-[8px] font-black shrink-0 shadow-inner">
                  {learner.avatar ? (
                    <img src={learner.avatar} alt={learner.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-70 text-[7px]">{learner.name.charAt(0)}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold truncate flex-1",
                  isMe ? "text-text-main shadow-sm" : "text-text-main/80"
                )}>{learner.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[7px] font-black text-text-muted bg-surface/80 px-1 py-0.5 rounded-sm uppercase border border-border/30">Lv {20 - i}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

