import React from 'react';
import { Users, Target, Trophy, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LeaderboardStatsProps {
  totalUsers: number;
  yourRank: number | null;
  topScore: number;
  /** ISO timestamp the weekly window closes at, or null on the all-time board. */
  resetsAt: string | null;
}

/** Live countdown to the end of the weekly window. */
function useCountdown(resetsAt: string | null) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!resetsAt) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [resetsAt]);

  if (!resetsAt) return null;
  const ms = new Date(resetsAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 'now';

  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function LeaderboardStats({ totalUsers, yourRank, topScore, resetsAt }: LeaderboardStatsProps) {
  const countdown = useCountdown(resetsAt);

  return (
    /* Three tiles on the all-time board, four on the weekly one. A fixed
       four-column grid left an empty cell whenever the countdown was absent. */
    <div className={cn('grid grid-cols-2 gap-3', countdown ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
      <StatCard
        icon={<Users size={15} className="text-pastel-sky-ink" />}
        label="On the board"
        value={totalUsers.toLocaleString()}
      />
      <StatCard
        icon={<Target size={15} className="text-primary" />}
        label="Your rank"
        value={yourRank ? `#${yourRank}` : '—'}
        /* The hint has to follow the range: "study this week to rank" is wrong
           advice on the all-time board. */
        hint={!yourRank ? (resetsAt ? 'Study this week to rank' : 'Study to get ranked') : undefined}
        highlight={!!yourRank}
      />
      <StatCard
        icon={<Trophy size={15} className="text-pastel-peach-ink" />}
        label="Top score"
        value={topScore.toLocaleString()}
      />
      {/* Only shown on the weekly board. All-time never resets, and the old
          card claimed "Resets in 4d 12h" on both — a string constant the server
          sent to everyone regardless of the date. */}
      {countdown && (
        <StatCard
          icon={<Timer size={15} className="text-pastel-mint-ink" />}
          label="Week ends in"
          value={countdown}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border flex flex-col gap-1',
      highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface'
    )}>
      <span className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      </span>
      {/* Was `text-white` on a white card — invisible on every tile that
          wasn't the highlighted one. */}
      <span className={cn(
        'text-lg font-bold tracking-tight tabular-nums',
        highlight ? 'text-primary' : 'text-text-main'
      )}>
        {value}
      </span>
      {hint && <span className="text-[11px] text-text-muted leading-tight">{hint}</span>}
    </div>
  );
}
