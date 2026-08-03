import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Flame, Award } from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { User } from '../../types';
import { getMasteryColor } from '../../lib/utils';

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

  // 3. Streak from user. No fallback — inventing a 7-day streak for a user who
  //    has none is a lie the rest of the app then contradicts.
  const streak = user?.streak ?? 0;

  // 4. Badges unlocked
  const badgesCount = React.useMemo(() => {
    if (user?.achievements && user.achievements.length > 0) {
      return user.achievements.filter(a => a.isUnlocked).length;
    }
    return 0;
  }, [user]);

  const totalBadges = user?.achievements?.length ?? 0;

  const masteryThemeColor = getMasteryColor(avgMastery);

  // The card chrome stays uniform white paper. Each stat gets one fixed pastel
  // for its icon chip, tied to what the stat *is* — so the colour is a stable
  // label you learn once, not decoration that changes meaning per screen. The
  // value itself only takes colour when the number encodes health (mastery) or
  // a streak that is actually running.
  const statsCards = [
    {
      icon: BookOpen,
      label: 'Unread Materials',
      value: unreadCount,
      tone: 'lavender' as const,
      valueColor: undefined as string | undefined,
      live: false,
      desc: unreadCount > 0 ? 'Ready for study session' : 'Nothing waiting',
    },
    {
      icon: Target,
      label: 'Average Mastery',
      value: `${avgMastery}%`,
      tone: 'mint' as const,
      valueColor: masteryThemeColor,
      live: false,
      desc: avgMastery >= 80 ? 'Mastered' : avgMastery >= 50 ? 'Developing' : 'Starter level',
    },
    {
      icon: Flame,
      label: 'Study Streak',
      value: `${streak} ${streak === 1 ? 'day' : 'days'}`,
      tone: 'peach' as const,
      valueColor: streak > 0 ? '#C2610C' : undefined,
      live: streak > 0,
      desc: streak > 0 ? 'Streak is alive' : 'Study today to start one',
    },
    {
      icon: Award,
      label: 'Badges Unlocked',
      value: badgesCount,
      tone: 'pink' as const,
      valueColor: undefined as string | undefined,
      live: false,
      desc: totalBadges > 0 ? `Out of ${totalBadges} achievements` : 'None unlocked yet',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {statsCards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative overflow-hidden soft-card p-4 active:scale-[0.98] select-none flex flex-col justify-between min-h-[118px]"
          >
            <div className="flex items-start justify-between gap-2.5">
              {/* Two lines of room, so "Unread Materials" and "Badges Unlocked"
                  stop clipping to "Unread…" / "Badges…" in the 2-up mobile grid.
                  min-h keeps all four cards aligned when a label needs one. */}
              <span className="text-[11px] font-semibold text-text-muted tracking-tight leading-snug line-clamp-2 min-h-[2.2em]">
                {stat.label}
              </span>
              <div
                className="p-1.5 rounded-xl pointer-events-none shrink-0"
                style={{ backgroundColor: `var(--pastel-${stat.tone})` }}
              >
                <Icon
                  className={`h-5 w-5 ${stat.live ? 'animate-pulse' : ''}`}
                  style={{ color: stat.valueColor ?? `var(--pastel-${stat.tone}-ink)` }}
                />
              </div>
            </div>

            <div className="mt-2.5">
              <div
                className="text-lg font-extrabold tracking-tight"
                style={{ color: stat.valueColor ?? 'var(--text-main)' }}
              >
                {stat.value}
              </div>
              <p className="text-[11px] font-medium text-text-muted/70 mt-0.5">
                {stat.desc}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
