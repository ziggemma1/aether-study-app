import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Award, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';

/** Rank 1–3 dressing. Lucide icons, not 🥈/🥉 — the app has a real icon set,
 *  and two of the three ranks were emoji while the first was an SVG. */
export const PLACES = [
  { chip: 'bg-pastel-peach text-pastel-peach-ink', bar: 'bg-pastel-peach', Icon: Crown, label: '1st' },
  { chip: 'bg-pastel-sky text-pastel-sky-ink', bar: 'bg-pastel-sky', Icon: Medal, label: '2nd' },
  { chip: 'bg-pastel-lavender text-pastel-lavender-ink', bar: 'bg-pastel-lavender', Icon: Award, label: '3rd' }
];

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onSelect: (id: string) => void;
}

export function Podium({ entries, currentUserId, onSelect }: PodiumProps) {
  // Render order 2 · 1 · 3 so the winner stands in the middle. Heights are
  // fixed per place, not scaled by score — a pedestal is a rank, not a bar
  // chart, and scaling it would double-encode the number printed on it.
  const layout = [
    { entry: entries[1], place: 1, height: 'h-16 sm:h-20', avatar: 56 },
    { entry: entries[0], place: 0, height: 'h-24 sm:h-28', avatar: 72 },
    { entry: entries[2], place: 2, height: 'h-11 sm:h-14', avatar: 56 }
  ].filter((c) => c.entry);

  if (layout.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] px-3 sm:px-6 pt-6 sm:pt-8 pb-5 overflow-hidden">
      {/* The pedestals used to run straight into the card's bottom edge, where
          its rounded corners sliced their corners off and the whole block read
          as clipped rather than as standing on something. They now rest on a
          floor rule inside the card. */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 border-b border-border">
        {layout.map(({ entry, place, height, avatar }, i) => {
          const p = PLACES[place];
          const isMe = entry!.id === currentUserId;

          return (
            <motion.button
              key={entry!.id}
              type="button"
              onClick={() => onSelect(entry!.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
              /* min-w-0 is load-bearing: a flex item defaults to
                 `min-width: auto`, so without it the column refuses to shrink
                 below its longest name, `truncate` never engages, and at phone
                 widths the three columns overlap each other. */
              className="flex-1 min-w-0 basis-0 max-w-[10rem] flex flex-col items-center text-center group cursor-pointer"
              aria-label={`${p.label}: ${entry!.name}, ${entry!.points.toLocaleString()} points`}
            >
              <span className={cn(
                'mb-2 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
                p.chip
              )}>
                <p.Icon size={16} />
              </span>

              <Avatar
                name={entry!.name}
                src={entry!.avatar}
                size={avatar}
                className={cn(
                  'ring-2 ring-offset-2 ring-offset-surface transition-all group-hover:-translate-y-0.5',
                  isMe ? 'ring-primary' : 'ring-border'
                )}
              />

              <span className="mt-2 w-full px-1 text-xs sm:text-sm font-semibold text-text-main truncate">
                {isMe ? 'You' : entry!.name}
              </span>

              <span className="mt-0.5 flex items-baseline gap-1 font-mono text-sm sm:text-base font-bold text-text-main tabular-nums">
                {entry!.points.toLocaleString()}
                <span className="text-[10px] font-sans font-medium text-text-muted">pts</span>
              </span>

              {entry!.streak > 0 && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-text-muted">
                  <Flame size={11} className="text-brand-orange" />
                  {entry!.streak}
                </span>
              )}

              {/* Pedestal */}
              <div className={cn(
                'w-full mt-3 rounded-t-xl border border-b-0 border-border/60 flex items-start justify-center pt-2',
                height,
                p.bar
              )}>
                <span className="text-xs font-bold text-text-main/70">{p.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
