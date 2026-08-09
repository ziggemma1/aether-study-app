import React from 'react';
import { Play, Pause, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PomodoroTimerProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  durationMinutes: number;
  onToggle: () => void;
  onSetDuration: (minutes: number) => void;
}

const DURATION_PRESETS = [15, 25, 45, 60];

/**
 * Focus timer for a live room.
 *
 * The control used to be a `bg-white text-black` circle carrying a
 * `0 0 30px rgba(0,0,0,0.5)` glow — an inverted dark-mode treatment that, on
 * white paper, read as a detached disc floating off the edge of its own card.
 * It is now the app's primary button, sitting inside the card like everything
 * else.
 *
 * The round length used to be a hardcoded 25 minutes. The preset row below
 * mirrors the pill picker Onboarding already uses for session length — same
 * pattern, so it doesn't introduce a second "how long" control that looks
 * different from the one elsewhere in the app. It only shows up while
 * paused: changing the length mid-focus would yank time out from under an
 * active session (useLiveRoom enforces this too, not just the UI).
 */
export function PomodoroTimer({
  minutes, seconds, isRunning, durationMinutes, onToggle, onSetDuration
}: PomodoroTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - currentSeconds) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <span className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-pastel-sky text-pastel-sky-ink items-center justify-center">
          <Timer size={20} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div className="flex items-center gap-1 font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
              <span>{String(minutes).padStart(2, '0')}</span>
              <span className={cn('text-text-muted', isRunning && 'animate-pulse')}>:</span>
              <span>{String(seconds).padStart(2, '0')}</span>
            </div>
            <span className="text-xs text-text-muted shrink-0">
              {isRunning ? 'Focusing' : 'Paused'}
            </span>
          </div>

          <div className="h-1.5 w-full bg-[var(--ring-track)] rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>

        <button
          onClick={onToggle}
          aria-label={isRunning ? 'Pause the focus timer' : 'Start the focus timer'}
          className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-primary text-white hover:bg-primary/90"
        >
          {isRunning ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current ml-0.5" />}
        </button>
      </div>

      {!isRunning && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-text-muted mr-1">Round length</span>
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onSetDuration(preset)}
              aria-pressed={durationMinutes === preset}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                durationMinutes === preset
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-alt text-text-main border-border hover:border-primary/30'
              )}
            >
              {preset} min
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
