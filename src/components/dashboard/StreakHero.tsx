import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, AlertTriangle } from 'lucide-react';
import StreakFlame from '../StreakFlame';
import { CountUp } from '../motion/CountUp';
import { PopOnChange } from '../motion/Pop';
import { streakTier, nextStreakTier, tierProgress } from '../../lib/streak';

interface StreakHeroProps {
  streak: number;
  longestStreak: number;
  /** Minutes studied today. Zero means the streak is at risk. */
  todayMinutes: number;
}

/**
 * The streak, promoted from one of four identical tiles to a hero panel.
 *
 * Three states, and they should look obviously different at a glance:
 *  - none      no streak yet, invitational
 *  - alive     studied today, flame lit and flickering at tier amplitude
 *  - at risk   streak exists but nothing logged today — flame goes cold,
 *              the panel picks up a warning edge, and the CTA gets urgent
 *
 * Colour is entirely tokenised from the reward palette in
 * src/styles/gamification.css — flame-mid/flame-ink for fire, brand-pink for
 * risk, text-muted for dormant. This is the "spend colour on wins" rule: the
 * only warm panel on an otherwise calm dashboard.
 */
export function StreakHero({ streak, longestStreak, todayMinutes }: StreakHeroProps) {
  const studiedToday = todayMinutes > 0;
  const tier = streakTier(streak);
  const next = nextStreakTier(streak);
  const progress = tierProgress(streak);

  const hasStreak = streak > 0;
  const atRisk = hasStreak && !studiedToday;
  const isRecord = hasStreak && streak >= longestStreak && streak > 1;

  // One accent token drives the whole panel, so the three states read as one
  // component in different moods rather than three different cards.
  const accent = !hasStreak ? 'text-text-muted' : atRisk ? 'text-brand-pink' : 'text-flame-ink';

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[var(--radius-card)] border shadow-[var(--shadow-card)] p-5 sm:p-6',
        'flex items-center gap-5',
        atRisk
          ? 'bg-brand-pink/[0.04] border-brand-pink/30'
          : hasStreak
            ? 'bg-flame-mid/[0.07] border-flame-mid/30'
            : 'bg-surface border-border'
      ].join(' ')}
      aria-label={`Day streak: ${streak}${atRisk ? ', at risk' : ''}`}
    >
      {/* Warm wash behind the flame. Pointer-events-none so it never eats a click. */}
      {hasStreak && !atRisk && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 -top-10 w-48 h-48 rounded-full bg-flame-mid/15 blur-3xl"
        />
      )}

      {/* ---- Flame ---- */}
      <div className={`relative shrink-0 ${accent}`}>
        <StreakFlame
          days={streak}
          studiedToday={studiedToday}
          size={tier.flameSize}
          intensity={tier.scale}
        />
      </div>

      {/* ---- Numbers + state ---- */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-micro font-bold uppercase tracking-widest text-text-muted">
            Day streak
          </p>
          {isRecord && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-flame-mid/20 text-flame-ink text-[11px] font-bold">
              <Trophy size={11} /> Personal best
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-0.5">
          {/* Pops and bursts confetti when the streak actually advances. */}
          <PopOnChange trigger={streak} confetti={streak > 0 ? 'win' : false}>
            <span
              className={`font-heading font-extrabold tracking-tighter leading-none ${accent} ${
                hasStreak ? 'text-5xl sm:text-6xl' : 'text-4xl'
              }`}
            >
              {hasStreak ? <CountUp value={streak} /> : '0'}
            </span>
          </PopOnChange>
          <span className="text-sm font-semibold text-text-muted">
            {streak === 1 ? 'day' : 'days'}
          </span>
          {hasStreak && !atRisk && (
            <span className="ml-1 text-xs font-bold uppercase tracking-wide text-flame-ink/80">
              {tier.label}
            </span>
          )}
        </div>

        {/* ---- State line ---- */}
        {atRisk ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-brand-pink">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>
              Nothing logged today — study to keep your {streak}-day streak alive.
            </span>
          </p>
        ) : hasStreak ? (
          <p className="mt-2 text-xs text-text-muted">
            {next
              ? <>Studied today. <strong className="text-text-main">{next.min - streak} {next.min - streak === 1 ? 'day' : 'days'}</strong> to {next.label}.</>
              : <>Studied today. You are at the top tier — keep it burning.</>}
          </p>
        ) : (
          <p className="mt-2 text-xs text-text-muted">
            Study on any day to light your first flame. Streaks are the score that's hardest to fake.
          </p>
        )}

        {/* ---- Tier progress ---- */}
        {hasStreak && next && (
          <div
            className="mt-3 h-1.5 w-full max-w-[220px] rounded-full bg-[var(--ring-track)] overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${next.label}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                atRisk ? 'bg-brand-pink/60' : 'bg-flame-mid'
              }`}
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </div>
        )}

        {/* ---- Longest streak context: what there is to lose ---- */}
        {longestStreak > 0 && !isRecord && (
          <p className="mt-2 text-[11px] text-text-muted">
            Your best is <strong className="text-text-main">{longestStreak} days</strong>.
          </p>
        )}
      </div>

      {/* ---- CTA ---- */}
      <div className="hidden sm:flex shrink-0 self-center">
        <Link
          to="/rooms"
          className={[
            'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px]',
            atRisk
              ? 'bg-brand-pink text-white hover:bg-brand-pink/90'
              : 'bg-surface border border-border text-text-main hover:border-primary/30'
          ].join(' ')}
        >
          {atRisk ? 'Keep it alive' : hasStreak ? 'Study' : 'Start'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
