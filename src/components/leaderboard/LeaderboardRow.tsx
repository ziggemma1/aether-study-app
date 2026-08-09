import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Clock, CheckCircle2, ChevronDown, UserPlus, ArrowUp } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { PLACES } from './Podium';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** Leader's score, used for the relative-progress bar. */
  topScore: number;
  /** The person one place above, for the "points to catch up" line. */
  ahead?: LeaderboardEntry;
  isCurrentUser: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onAddFriend?: (id: string) => void;
  /** Pinned copy of your own row, shown when you rank below the visible list. */
  pinned?: boolean;
  index?: number;
}

export function LeaderboardRow({
  entry,
  topScore,
  ahead,
  isCurrentUser,
  isExpanded,
  onToggle,
  onAddFriend,
  pinned = false,
  index = 0
}: LeaderboardRowProps) {
  const place = entry.rank <= 3 ? PLACES[entry.rank - 1] : null;
  // No floor on the width: a 0-point row drew a visible stub, which read as
  // "some progress" for someone who has not started.
  const share = topScore > 0 && entry.points > 0
    ? Math.max(3, Math.round((entry.points / topScore) * 100))
    : 0;
  const gap = ahead ? ahead.points - entry.points : 0;

  return (
    <motion.div
      layout
      initial={pinned ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: pinned ? 0 : Math.min(index, 8) * 0.03, duration: 0.3 }}
      className={cn(
        'rounded-2xl border transition-colors',
        isCurrentUser
          ? 'bg-primary/5 border-primary/30'
          : 'bg-surface border-border hover:border-primary/25'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left cursor-pointer min-h-[44px]"
      >
        {/* Rank */}
        <span className={cn(
          'w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums',
          place ? place.chip : 'bg-surface-alt text-text-muted'
        )}>
          {place ? <place.Icon size={16} /> : entry.rank}
        </span>

        <Avatar name={entry.name} src={entry.avatar} size={40} />

        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-sm text-text-main truncate">{entry.name}</span>
            {isCurrentUser && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </span>

          {/* Where they sit relative to the leader. A leaderboard's whole point
              is the comparison, and the old row printed four bare numbers with
              nothing to compare them against. */}
          <span className="block mt-1.5 h-1 w-full max-w-[220px] rounded-full bg-[var(--ring-track)] overflow-hidden">
            <motion.span
              className={cn('block h-full rounded-full', isCurrentUser ? 'bg-primary' : 'bg-secondary')}
              initial={{ width: 0 }}
              animate={{ width: `${share}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </span>
        </span>

        <span className="shrink-0 flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-text-main tabular-nums">
            <Zap size={14} className="text-secondary" fill="currentColor" />
            {entry.points.toLocaleString()}
          </span>
          <ChevronDown
            size={16}
            className={cn('text-text-muted transition-transform', isExpanded && 'rotate-180')}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-border/70 mt-1">
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Metric icon={<Clock size={13} />} label="Studied" value={formatTime(entry.studyMinutes)} />
                <Metric icon={<CheckCircle2 size={13} />} label="Quizzes" value={String(entry.quizzes)} />
                <Metric icon={<Flame size={13} />} label="Streak" value={`${entry.streak}d`} />
              </div>

              {gap > 0 && ahead && (
                <p className="mt-3 text-xs text-text-muted flex items-center gap-1.5">
                  <ArrowUp size={13} className="text-accent" />
                  {gap.toLocaleString()} points behind {ahead.name}
                </p>
              )}

              {!isCurrentUser && onAddFriend && (
                <button
                  onClick={() => onAddFriend(entry.id)}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-alt hover:bg-primary/10 hover:text-primary text-text-main border border-border transition-colors cursor-pointer min-h-[36px]"
                >
                  <UserPlus size={14} /> Add friend
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-alt/70 px-3 py-2">
      <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
        {icon} {label}
      </span>
      <span className="block mt-0.5 text-sm font-semibold text-text-main tabular-nums">{value}</span>
    </div>
  );
}
