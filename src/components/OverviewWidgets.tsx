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

// --- Styles ---
const stripeStyle = {
  backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
  backgroundSize: '10px 10px'
};

// --- Sub-components ---

export function QuizScoreCard({ score = 0, trend = 0, highest = 0, lowest = 0 }: { score?: number, trend?: number, highest?: number, lowest?: number }) {
  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-3 sm:p-5 flex flex-col w-full aspect-square max-w-[160px] sm:max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted">Avg Quiz Score</p>
      </div>
      
      <div className="flex items-center gap-1 mb-1 sm:mb-2">
        <span className="text-xl sm:text-3xl font-semibold text-text-main tracking-tight">{Math.round(score)}%</span>
        {trend !== 0 && (
          <span className={cn(
            "flex items-center text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md",
            trend > 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
          )}>
            {trend > 0 ? '+' : ''}{trend}% {trend > 0 ? <TrendingUp size={6} className="sm:ml-0.5" /> : <ChevronDown size={6} className="sm:ml-0.5" />}
          </span>
        )}
      </div>

      <div className="border-t border-dashed border-border/40 my-2 sm:my-3" />

      <div className="space-y-2 sm:space-y-4 mt-auto">
        <div className="space-y-1">
          <div className="flex justify-between text-xs sm:text-sm font-medium text-text-muted">
            <span>Highest</span>
            <span className="text-text-main font-semibold">{highest}%</span>
          </div>
          <div className="h-2.5 sm:h-3 bg-surface-alt/30 rounded-md overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${highest}%` }}
              className="h-full bg-primary rounded-md" 
              style={stripeStyle}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs sm:text-sm font-medium text-text-muted">
            <span>Lowest</span>
            <span className="text-text-main font-semibold">{lowest}%</span>
          </div>
          <div className="h-2.5 sm:h-3 bg-surface-alt/30 rounded-md overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${lowest}%` }}
              className="h-full bg-orange-500 rounded-md" 
              style={stripeStyle}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TimeSpentCard({ totalMinutes = 0, trend = 0, weeklyData = [] }: { totalMinutes?: number, trend?: number, weeklyData?: { day: string, hours: number }[] }) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const displayTime = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` 
    : `${minutes}m`;

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-3 sm:p-5 flex flex-col w-full aspect-square max-w-[160px] sm:max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted">Total Time</p>
      </div>

      <div className="flex items-center gap-1 mb-1 sm:mb-2 text-nowrap">
        <span className="text-xl sm:text-3xl font-semibold text-text-main tracking-tight shrink-0">{displayTime}</span>
        {trend !== 0 && (
          <span className={cn(
            "flex items-center text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ml-auto",
            trend > 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="border-t border-dashed border-border/40 my-2 sm:my-3" />

      <div className="flex justify-between text-[10px] sm:text-xs font-medium text-text-muted mb-1 sm:mb-2">
        <span>This Week</span>
        <span className="text-text-main font-semibold">
          {weeklyData.reduce((acc, curr) => acc + curr.hours, 0) < 1 
            ? `${Math.round(weeklyData.reduce((acc, curr) => acc + curr.hours, 0) * 60)}M`
            : `${Math.floor(weeklyData.reduce((acc, curr) => acc + curr.hours, 0))}H`}
        </span>
      </div>

      <div className="h-12 sm:h-20 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={weeklyData}>
            <Bar dataKey="hours" radius={[2, 2, 0, 0]}>
              {weeklyData.map((entry, index) => {
                const isToday = new Date().getDay() === (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(entry.day));
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isToday ? 'var(--primary)' : 'var(--border)'} 
                    fillOpacity={isToday ? 1 : 0.2}
                    style={isToday ? stripeStyle : {}}
                    className="transition-all duration-300"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function StreakCard({ currentStreak = 0, longestStreak = 0 }: { currentStreak?: number, longestStreak?: number }) {
  // Real life functional day generation based on the actual calendar week
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = new Date().getDay();
  
  // Get the last 5 days strictly wrapping around standard calendar indices
  const displayDays = Array.from({ length: 5 }, (_, i) => {
    const historicalIndex = (todayIndex - 4 + i + 7) % 7;
    // Assuming if the current streak covers this day looking backwards, it's 'active'
    const isActive = (4 - i) < currentStreak;
    return {
      label: daysOfWeek[historicalIndex],
      active: isActive
    };
  });

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-3 sm:p-5 flex flex-col w-full aspect-square max-w-[160px] sm:max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted">Weekly Streak</p>
      </div>

      <div className="flex items-center gap-1 mb-1 sm:mb-2">
        <span className="text-xl sm:text-3xl font-semibold text-text-main tracking-tight">{currentStreak} Days</span>
      </div>

      <div className="border-t border-dashed border-border/40 my-2 sm:my-3" />

      <div className="flex justify-between text-[10px] sm:text-xs font-medium text-text-muted mb-2 sm:mb-4">
        <span>Longest</span>
        <span className="text-text-main font-semibold">{longestStreak}d</span>
      </div>

      <div className="overflow-hidden flex-grow flex items-end">
        <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full">
          {displayDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1 sm:gap-1.5">
              <div className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all shadow-sm ring-1 ring-inset",
                day.active 
                  ? "bg-primary text-white ring-primary shadow-primary/20" 
                  : "bg-surface-alt/50 text-text-muted ring-border/50"
              )}>
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function RankingCard({ rank = 0, total = 0, topLearnersData = [] }: { rank?: number, total?: number, topLearnersData?: { name: string, avatar?: string }[] }) {
  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-3 sm:p-5 flex flex-col w-full aspect-square max-w-[160px] sm:max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted">Global Rank</p>
      </div>

      <div className="flex items-baseline gap-1 mb-1 sm:mb-2 text-nowrap">
        <span className="text-xl sm:text-3xl font-semibold text-text-main tracking-tight shrink-0">#{rank}</span>
        <span className="text-[10px] sm:text-[11px] text-text-muted font-medium truncate">of {total > 1000 ? `${(total/1000).toFixed(0)}K` : total}</span>
      </div>

      <div className="border-t border-dashed border-border/40 my-2 sm:my-3" />

      <p className="text-[10px] sm:text-xs font-medium text-text-muted mb-2 sm:mb-3 uppercase tracking-tighter">Top local</p>

      <div className="overflow-y-auto custom-scrollbar pr-1 -mr-1 flex-grow">
        <div className="space-y-1.5 sm:space-y-2.5">
          {topLearnersData.map((learner, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="relative shrink-0">
                {learner.avatar ? (
                  <img src={learner.avatar} alt={learner.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-border/20 object-cover" />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary border border-primary/20">
                    {learner.name.charAt(0)}
                  </div>
                )}
                {i === 0 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full flex items-center justify-center text-[7px] sm:text-[9px] text-white border border-white">
                    ★
                  </div>
                )}
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-text-main truncate">{learner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

