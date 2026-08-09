import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RotateCw, Trophy, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Podium } from '../components/leaderboard/Podium';
import { LeaderboardRow } from '../components/leaderboard/LeaderboardRow';
import { LeaderboardStats } from '../components/leaderboard/LeaderboardStats';
import { OptInToggle } from '../components/leaderboard/OptInToggle';
import { useLeaderboard, LeaderboardRange } from '../hooks/useLeaderboard';

const RANGES: { id: LeaderboardRange; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'week', label: 'This week' }
];

export default function Leaderboard() {
  const { user, setUser, showToast, sendFriendRequest } = useAppContext();
  const [optedIn, setOptedIn] = React.useState(user?.optedInLeaderboard || false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  // All-time is the default because it is always populated. Defaulting to the
  // week would show an empty board to everyone every Monday morning.
  const [range, setRange] = React.useState<LeaderboardRange>('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const {
    leaderboard,
    currentUser,
    totalUsers,
    topScore,
    resetsAt,
    loading,
    error,
    hasMore,
    showMore,
    refetch
  } = useLeaderboard(range);

  const myId = user?.id || (user as any)?._id;

  const toggleOptIn = async () => {
    setIsUpdating(true);
    try {
      const response = await api.post('/users/leaderboard/toggle');
      const newStatus = response.data.optedInLeaderboard;
      setOptedIn(newStatus);
      if (setUser && user) setUser({ ...user, optedInLeaderboard: newStatus });
      showToast(
        newStatus ? "You're on the leaderboard." : 'You have left the leaderboard.',
        'success'
      );
      refetch();
    } catch {
      showToast("That didn't work. Please try again.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!optedIn) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full min-w-0 pt-10 md:pt-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <OptInToggle onToggle={toggleOptIn} isLoading={isUpdating} />
        </motion.div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  // Your row is pinned below the list only when you rank past the slice on
  // screen. Previously you simply dropped off the board with no indication of
  // where you actually stood.
  const showPinnedSelf = !!currentUser && !leaderboard.some((e) => e.id === currentUser.id);

  const toggleRow = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const addFriend = async (id: string) => {
    try {
      await sendFriendRequest(id);
    } catch {
      /* sendFriendRequest surfaces its own toast */
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full min-w-0 pb-24">
      <PageHeader
        title="Leaderboard"
        subtitle="Ranked on points from study sessions and quizzes."
        action={
          <button
            onClick={toggleOptIn}
            disabled={isUpdating}
            className="text-xs font-semibold text-text-muted hover:text-brand-pink transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isUpdating ? <Loader2 size={13} className="animate-spin" /> : null}
            Leave leaderboard
          </button>
        }
      />

      {/* Range switch. The board was all-time only, but everything around it —
          "weekly academic recognition", "Resets in" — described a weekly one. */}
      <div className="inline-flex p-1 rounded-xl bg-surface-alt border border-border mb-5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => { setRange(r.id); setExpandedId(null); }}
            aria-pressed={range === r.id}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px]',
              range === r.id
                ? 'bg-surface text-text-main shadow-[var(--shadow-card)]'
                : 'text-text-muted hover:text-text-main'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <LeaderboardStats
        totalUsers={totalUsers}
        yourRank={currentUser?.rank ?? null}
        topScore={topScore}
        resetsAt={range === 'week' ? resetsAt : null}
      />

      <div className="mt-6 space-y-4">
        {error ? (
          /* The hook used to swallow failures, so a 500 rendered as an empty
             board — "no one is ranked" and "we couldn't reach the server" are
             very different things to tell someone. */
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
            <span className="inline-flex w-11 h-11 rounded-xl bg-brand-pink/10 text-brand-pink items-center justify-center">
              <AlertTriangle size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-text-main">We couldn't load the leaderboard</p>
            <p className="text-xs text-text-muted mt-1">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              <RotateCw size={15} /> Try again
            </button>
          </div>
        ) : loading && leaderboard.length === 0 ? (
          <div className="space-y-3">
            <div className="h-52 rounded-[var(--radius-card)] bg-[var(--skeleton)] animate-pulse" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[var(--skeleton)] animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface-alt/50 p-10 text-center">
            <span className="inline-flex w-11 h-11 rounded-xl bg-pastel-peach text-pastel-peach-ink items-center justify-center">
              <Trophy size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-text-main">
              {range === 'week' ? 'Nobody has studied yet this week' : 'No one is ranked yet'}
            </p>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              {range === 'week'
                ? 'Finish a study session or a quiz and you will be first on the board.'
                : 'Points come from study sessions and quizzes. Start one to get on the board.'}
            </p>
          </div>
        ) : (
          <>
            <Podium entries={top3} currentUserId={myId} onSelect={toggleRow} />

            <div className="space-y-2.5">
              {/* Expanding a podium place opens its detail directly under the
                  podium, so the top three are as inspectable as everyone else. */}
              {top3
                .filter((e) => e.id === expandedId)
                .map((entry) => (
                  <LeaderboardRow
                    key={`podium-${entry.id}`}
                    entry={entry}
                    topScore={topScore}
                    ahead={leaderboard[entry.rank - 2]}
                    isCurrentUser={entry.id === myId}
                    isExpanded
                    onToggle={() => setExpandedId(null)}
                    onAddFriend={addFriend}
                  />
                ))}

              {rest.map((entry, i) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  index={i}
                  topScore={topScore}
                  ahead={leaderboard[entry.rank - 2]}
                  isCurrentUser={entry.id === myId}
                  isExpanded={expandedId === entry.id}
                  onToggle={() => toggleRow(entry.id)}
                  onAddFriend={addFriend}
                />
              ))}

            </div>

            {hasMore && (
              <button
                onClick={showMore}
                disabled={loading}
                className="w-full py-3 rounded-2xl border border-border bg-surface hover:border-primary/25 text-sm font-semibold text-text-main transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Loading…</>
                  : <>Show more <ChevronDown size={15} /></>}
              </button>
            )}

            {showPinnedSelf && currentUser && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
                  Your position
                </p>
                <LeaderboardRow
                  entry={currentUser}
                  topScore={topScore}
                  isCurrentUser
                  pinned
                  isExpanded={expandedId === currentUser.id}
                  onToggle={() => toggleRow(currentUser.id)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
