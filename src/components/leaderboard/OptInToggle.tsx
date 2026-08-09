import React from 'react';
import { Trophy, Flame, Eye, Users, ArrowRight, Loader2 } from 'lucide-react';

interface OptInToggleProps {
  onToggle: () => void;
  isLoading?: boolean;
}

/**
 * The gate shown while a user is opted out.
 *
 * The old version put icon, copy and button in one `flex-row` with no wrapping
 * rule, so at anything under a very wide viewport the text column collapsed to
 * ~40 characters and its two feature chips stacked into a ragged stub. The copy
 * was also written in house jargon — "Arena Opt-In Required", "calculate your
 * study recall metrics" — for a screen whose only job is to explain a choice.
 */
export function OptInToggle({ onToggle, isLoading }: OptInToggleProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-6 sm:p-8 text-center">
      <span className="inline-flex w-14 h-14 rounded-2xl bg-pastel-peach text-pastel-peach-ink items-center justify-center mx-auto">
        <Trophy size={26} />
      </span>

      <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-main tracking-tight mt-4">
        Join the leaderboard
      </h2>
      <p className="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
        See how your study time stacks up against everyone else using Aether.
        You can leave again at any time.
      </p>

      <ul className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
        <Point icon={<Users size={15} />} title="Weekly and all-time">
          Ranked on the points you earn from sessions and quizzes.
        </Point>
        <Point icon={<Flame size={15} />} title="Keep your streak visible">
          Your streak and study hours show on your row.
        </Point>
        <Point icon={<Eye size={15} />} title="Only your name and score">
          Nothing you upload or write is ever shown.
        </Point>
      </ul>

      <button
        onClick={onToggle}
        disabled={isLoading}
        className="mt-7 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer min-h-[44px]"
      >
        {isLoading ? <><Loader2 size={16} className="animate-spin" /> Joining…</> : <>Join the leaderboard <ArrowRight size={16} /></>}
      </button>
    </div>
  );
}

function Point({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-border bg-surface-alt/60 p-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-text-main">
        <span className="text-primary">{icon}</span> {title}
      </span>
      <span className="block text-xs text-text-muted mt-1 leading-relaxed">{children}</span>
    </li>
  );
}
