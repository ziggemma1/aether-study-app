import React from 'react';

interface StreakFlameProps {
  days: number;
  studiedToday: boolean;
  size?: number | string;
  className?: string;
  /**
   * Flame amplitude, from `streakTier().scale`. Drives --flame-scale, which
   * the shared `.motion-flicker` keyframe multiplies into its transform — so a
   * 60-day inferno visibly moves more than a 1-day ember without needing a
   * second animation. Reduced motion is handled globally in motion.css.
   */
  intensity?: number;
}

export default function StreakFlame({
  days,
  studiedToday,
  size = 64,
  className = "",
  intensity = 1
}: StreakFlameProps) {
  // Classification.
  // A flame that has never been lit (no streak at all) is the only state
  // that goes fully cold/grey. An *existing* streak keeps its warm tier
  // colour all day — losing it to the dead-ember grey the instant today's
  // session hasn't happened YET read as "streak already broken" at any hour,
  // which is the muted/greyscale bug this was fixed for. "At risk" is
  // conveyed by holding the flame steady (no flicker, no blazing halo)
  // rather than by desaturating it — the pink banner/CTA in StreakHero
  // already carries the urgency.
  const isUnlit = days === 0;
  const isActive = !isUnlit && studiedToday;
  const isAtRisk = !isUnlit && !studiedToday;
  const isBlazing = isActive && days >= 3;
  const isWarm = isActive && days < 3;

  // Gradients definition key combinations to prevent conflicts in SVGs
  const outerGradId = `outer-flame-grad-${isUnlit ? 'cold' : 'warm'}`;
  const middleGradId = `middle-flame-grad-${isUnlit ? 'cold' : 'warm'}`;
  const innerGradId = `inner-flame-grad-${isUnlit ? 'cold' : 'warm'}`;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, ['--flame-scale' as string]: intensity }}
    >
      {/* Absolute glow ring beneath blazing hot flame */}
      {isBlazing && (
        <div className="absolute inset-0 bg-radial from-flame-mid/25 via-flame-edge/5 to-transparent rounded-full filter blur-xl animate-pulse" />
      )}
      {/* At risk: still a lit, warm flame — just a static wash instead of
          the blazing halo, since nothing is actively feeding it right now. */}
      {isAtRisk && (
        <div className="absolute inset-0 bg-radial from-flame-mid/12 to-transparent rounded-full filter blur-lg" />
      )}
      {/* Never lit — the only state that goes cold/grey. */}
      {isUnlit && (
        <div className="absolute inset-0 bg-radial from-flame-dead/12 to-transparent rounded-full filter blur-lg opacity-40" />
      )}

      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transform-gpu ${
          isBlazing ? 'motion-flicker filter drop-shadow-[0_4px_12px_color-mix(in_srgb,var(--flame-mid)_50%,transparent)]' : ''
        } ${isUnlit ? 'filter drop-shadow-[0_2px_4px_color-mix(in_srgb,var(--flame-dead)_20%,transparent)] opacity-60' : ''} ${
          isWarm ? 'filter drop-shadow-[0_3px_6px_color-mix(in_srgb,var(--flame-mid)_30%,transparent)]' : ''
        } ${isAtRisk ? 'filter drop-shadow-[0_3px_8px_color-mix(in_srgb,var(--flame-edge)_30%,transparent)]' : ''}`}
      >
        {/*
          Gradient stops are set via inline `style`, not the `stopColor`
          attribute. SVG presentation attributes do not resolve var(), so the
          attribute form would render black — the same trap the charts hit.
          Through `style` these are real CSS declarations and the flame tokens
          resolve, which is what lets the ramp change between light and dark.
        */}
        <defs>
          {/* Outer Flame Gradients */}
          <linearGradient id="outer-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-edge)', stopOpacity: 0.95 }} />
            <stop offset="60%" style={{ stopColor: 'var(--flame-mid)', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-mid)', stopOpacity: 0.3 }} />
          </linearGradient>
          <linearGradient id="outer-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-dead-ink)', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0.2 }} />
          </linearGradient>

          {/* Middle Flame Gradients */}
          <linearGradient id="middle-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-mid)', stopOpacity: 0.95 }} />
            <stop offset="70%" style={{ stopColor: 'var(--flame-core)', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-core)', stopOpacity: 0.2 }} />
          </linearGradient>
          <linearGradient id="middle-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-dead-ink)', stopOpacity: 0.85 }} />
            <stop offset="70%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0.55 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0 }} />
          </linearGradient>

          {/* Inner Flame Gradients */}
          <linearGradient id="inner-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-core)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'var(--flame-core)', stopOpacity: 0.95 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-mid)', stopOpacity: 0.3 }} />
          </linearGradient>
          <linearGradient id="inner-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0.9 }} />
            <stop offset="60%" style={{ stopColor: 'var(--flame-dead)', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: 'var(--flame-dead-ink)', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>

        {/* 1. Outer Flame Layer */}
        <path
          d="M50 92 C 18 92, 4 58, 44 14 C 47 10, 53 10, 56 14 C 96 58, 82 92, 50 92 Z"
          fill={`url(#${outerGradId})`}
        />

        {/* 2. Middle Flame Layer */}
        <path
          d="M50 88 C 26 88, 12 55, 46 26 C 48 23, 52 23, 54 26 C 88 55, 74 88, 50 88 Z"
          fill={`url(#${middleGradId})`}
          className={isBlazing ? 'animate-flame-inner' : ''}
          style={{ transformOrigin: '50px 88px' }}
        />

        {/* 3. Inner Core Flame Layer */}
        <path
          d="M50 84 C 33 84, 23 60, 48 40 C 49 38, 51 38, 52 40 C 77 60, 67 84, 50 84 Z"
          fill={`url(#${innerGradId})`}
          className={isBlazing ? 'animate-flame-inner' : ''}
          style={{ transformOrigin: '50px 84px', animationDelay: '0.4s' }}
        />
      </svg>
    </div>
  );
}
