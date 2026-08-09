/**
 * Streak tiers.
 *
 * The streak is the app's retention mechanic, so it needs to visibly grow
 * rather than just increment a number. Tiers give the flame something to
 * escalate through and give the user something to chase — "4 days to Blazing"
 * is a reason to come back tomorrow in a way that "streak: 10" is not.
 *
 * `scale` feeds --flame-scale in motion.css, so one keyframe animates a 1-day
 * ember and a 60-day inferno at different amplitudes.
 */

export type StreakTierId = 'none' | 'ember' | 'warm' | 'hot' | 'blazing' | 'inferno';

export interface StreakTier {
  id: StreakTierId;
  label: string;
  /** Inclusive lower bound, in days. */
  min: number;
  /** Flame size multiplier. */
  scale: number;
  /** Rendered pixel size of the flame at this tier. */
  flameSize: number;
}

export const STREAK_TIERS: StreakTier[] = [
  { id: 'none',    label: 'No streak', min: 0,  scale: 0.85, flameSize: 56 },
  { id: 'ember',   label: 'Ember',     min: 1,  scale: 0.95, flameSize: 64 },
  { id: 'warm',    label: 'Warm',      min: 3,  scale: 1.0,  flameSize: 72 },
  { id: 'hot',     label: 'Hot',       min: 7,  scale: 1.08, flameSize: 80 },
  { id: 'blazing', label: 'Blazing',   min: 14, scale: 1.16, flameSize: 88 },
  { id: 'inferno', label: 'Inferno',   min: 30, scale: 1.25, flameSize: 96 }
];

export function streakTier(days: number): StreakTier {
  let match = STREAK_TIERS[0];
  for (const t of STREAK_TIERS) {
    if (days >= t.min) match = t;
  }
  return match;
}

/** The next tier to reach, or null once the top tier is held. */
export function nextStreakTier(days: number): StreakTier | null {
  return STREAK_TIERS.find(t => t.min > days) || null;
}

/** 0–1 progress from the current tier's floor to the next tier's floor. */
export function tierProgress(days: number): number {
  const current = streakTier(days);
  const next = nextStreakTier(days);
  if (!next) return 1;
  const span = next.min - current.min;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (days - current.min) / span));
}
