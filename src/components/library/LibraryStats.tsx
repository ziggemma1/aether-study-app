import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Flame, Award } from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { User } from '../../types';

interface LibraryStatsProps {
  materials: LibraryMaterial[];
  user: User | null;
}

export function LibraryStats({ materials, user }: LibraryStatsProps) {
  // 1. Calculate Unread/Unvisited Materials (mastery === 0 or unvisited)
  const unreadCount = React.useMemo(() => {
    return materials.filter(m => !m.mastery || m.mastery === 0).length;
  }, [materials]);

  // 2. Average Mastery
  const avgMastery = React.useMemo(() => {
    if (materials.length === 0) return 0;
    const total = materials.reduce((acc, m) => acc + (m.mastery || 0), 0);
    return Math.round(total / materials.length);
  }, [materials]);

  // 3. Streak from user or fallback
  const streak = user?.streak ?? 7;

  // 4. Badges unlocked (from user achievements index or default)
  const badgesCount = React.useMemo(() => {
    if (user?.achievements && user.achievements.length > 0) {
      return user.achievements.filter(a => a.isUnlocked).length;
    }
    return 2; // Warm mock starter achievements count
  }, [user]);

  // Mastery health color definition
  const getMasteryColor = (pct: number) => {
    if (pct < 30) return '#FF5E7E'; // Ruby Red
    if (pct < 60) return '#F5B042'; // Amber Yellow
    if (pct < 80) return '#00D2FF'; // Cyan
    return '#00E5A0'; // Neon Emerald
  };

  const masteryThemeColor = getMasteryColor(avgMastery);

  const statsCards = [
    {
      icon: <BookOpen className="h-5 w-5 text-[#6C5CE7]" />,
      label: 'Unread Materials',
      value: unreadCount,
      color: '#6C5CE7',
      desc: 'Ready for study session',
    },
    {
      icon: <Target className="h-5 w-5" style={{ color: masteryThemeColor }} />,
      label: 'Average Mastery',
      value: `${avgMastery}%`,
      color: masteryThemeColor,
      desc: avgMastery >= 80 ? 'Mastered!' : avgMastery >= 50 ? 'Developing' : 'Starter level',
    },
    {
      icon: <Flame className="h-5 w-5 text-[#FF9F68] animate-pulse" />,
      label: 'Study Streak',
      value: `${streak} days`,
      color: '#FF9F68',
      desc: '🔥 Streak is alive!',
    },
    {
      icon: <Award className="h-5 w-5 text-[#FF55D2]" />,
      label: 'Badges Unlocked',
      value: badgesCount,
      color: '#FF55D2',
      desc: `Out of ${user?.achievements?.length || 8} achievements`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {statsCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-[#141A24]/90 p-4 border border-[#8E9AAF]/5 backdrop-blur-md transition-all duration-300 active:scale-[0.98] select-none shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[110px]"
          style={{ borderLeft: `4px solid ${stat.color}` }}
        >
          {/* Subtle Background Glow Accent matching stat color */}
          <div 
            className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-5 pointer-events-none"
            style={{ backgroundColor: stat.color }}
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#8E9AAF] tracking-tight leading-tight line-clamp-1">
              {stat.label}
            </span>
            <div className="p-1.5 rounded-lg bg-[#0B0E14]/60 pointer-events-none shrink-0">
              {stat.icon}
            </div>
          </div>

          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-[#F0F3F8] tracking-tight">
              {stat.value}
            </div>
            <p className="text-[10px] font-medium text-[#8E9AAF]/60 mt-0.5 mt-auto">
              {stat.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
