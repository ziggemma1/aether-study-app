import { useEffect, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';

/**
 * Motion system.
 *
 * Two halves that have to agree with each other:
 *  - src/styles/motion.css holds the CSS keyframes and the global
 *    prefers-reduced-motion guard.
 *  - this file holds the Framer Motion variants and the confetti helper,
 *    because JS-driven animation cannot be switched off from a stylesheet.
 *
 * Colour rule: nothing here hardcodes a hex. The confetti helper reads the
 * live theme tokens off the document at call time, which is the only way to
 * get themed colour onto a <canvas> — canvas cannot resolve var().
 */

const QUERY = '(prefers-reduced-motion: reduce)';

/** Synchronous read, for non-React call sites like celebrate(). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * Subscribes to the media query, so toggling the OS setting takes effect
 * without a reload.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/* --------------------------------------------------------------------------
   Framer Motion variants
   --------------------------------------------------------------------------
   Every set has a `reduced` twin that lands on the same final state with no
   travel and no delay, so layout never differs between the two paths — only
   the journey to it.
   -------------------------------------------------------------------------- */

const EASE: Transition['ease'] = [0.22, 0.61, 0.36, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } }
};

export const fadeInUpReduced: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0 } }
};

/** Parent of a staggered list. Pair with `staggerItem` on each child. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 }
  }
};

export const staggerContainerReduced: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0, delayChildren: 0 } }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } }
};

export const staggerItemReduced: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0 } }
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.84 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.42, ease: [0.34, 1.42, 0.64, 1] }
  }
};

export const popInReduced: Variants = {
  hidden: { opacity: 1, scale: 1 },
  show: { opacity: 1, scale: 1, transition: { duration: 0 } }
};

/** Picks the right variant pair for the current setting. */
export function motionVariants(reduced: boolean) {
  return {
    fadeInUp: reduced ? fadeInUpReduced : fadeInUp,
    staggerContainer: reduced ? staggerContainerReduced : staggerContainer,
    staggerItem: reduced ? staggerItemReduced : staggerItem,
    popIn: reduced ? popInReduced : popIn
  };
}

/* --------------------------------------------------------------------------
   Themed confetti
   -------------------------------------------------------------------------- */

/** Tokens the celebration palette is drawn from, in priority order. */
const CONFETTI_TOKENS = [
  '--primary',
  '--secondary',
  '--accent',
  '--brand-orange',
  '--brand-pink'
];

/**
 * canvas-confetti only understands hex. Custom properties are returned
 * as-authored, which in this theme means hex already — but a theme could
 * legitimately hold `rgb()`, so normalise rather than assume.
 */
function toHex(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return '#' + v.slice(1).split('').map(c => c + c).join('');
  }
  const m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) {
    const hex = m.slice(1, 4)
      .map(n => Math.max(0, Math.min(255, Math.round(parseFloat(n)))).toString(16).padStart(2, '0'))
      .join('');
    return '#' + hex;
  }
  return null;
}

/**
 * Reads the celebration palette from whatever theme is currently applied.
 * Accent themes move --primary/--secondary/--accent, so a purchased theme
 * changes the confetti too, for free.
 */
export function themeConfettiColors(): string[] {
  if (typeof window === 'undefined') return [];
  const styles = getComputedStyle(document.documentElement);
  const colors = CONFETTI_TOKENS
    .map(t => toHex(styles.getPropertyValue(t)))
    .filter((c): c is string => Boolean(c));
  // If a theme somehow resolves none of them, returning [] lets
  // canvas-confetti fall back to its own defaults rather than throwing.
  return colors;
}

export type CelebrationKind = 'small' | 'win' | 'milestone';

const PRESETS: Record<CelebrationKind, { particleCount: number; spread: number; startVelocity: number; scalar: number }> = {
  // Points ticked up, a card flipped correct.
  small: { particleCount: 22, spread: 52, startVelocity: 22, scalar: 0.75 },
  // Badge unlocked, quiz finished.
  win: { particleCount: 60, spread: 74, startVelocity: 32, scalar: 0.9 },
  // Streak milestone, level up.
  milestone: { particleCount: 110, spread: 100, startVelocity: 40, scalar: 1 }
};

/**
 * Fires a themed confetti burst. Silently does nothing when the user has
 * asked for reduced motion — call sites do not need to check first.
 *
 * `origin` is in viewport ratio units ({ x: 0.5, y: 0.5 } is dead centre).
 * Pass an element to burst from where the thing actually happened.
 */
export async function celebrate(
  kind: CelebrationKind = 'win',
  origin?: { x: number; y: number } | HTMLElement | null
): Promise<void> {
  if (prefersReducedMotion()) return;
  if (typeof window === 'undefined') return;

  let point = { x: 0.5, y: 0.42 };
  if (origin instanceof HTMLElement) {
    const r = origin.getBoundingClientRect();
    point = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight
    };
  } else if (origin) {
    point = origin;
  }

  try {
    // Loaded on demand: the celebration path is rare, and this keeps
    // canvas-confetti out of the initial bundle.
    const confetti = (await import('canvas-confetti')).default;
    const preset = PRESETS[kind];
    confetti({
      ...preset,
      origin: point,
      colors: themeConfettiColors(),
      disableForReducedMotion: true,
      ticks: kind === 'milestone' ? 220 : 140,
      gravity: 0.9,
      scalar: preset.scalar
    });
  } catch {
    // A missing/blocked canvas must never break the action that triggered it.
  }
}
