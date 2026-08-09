import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/motion';

interface CountUpProps {
  value: number;
  /** ms. Clamped internally so a jump from 0 to 9000 does not run for a minute. */
  duration?: number;
  decimals?: number;
  /** Render the tweened number however the caller likes (units, suffixes). */
  format?: (n: number) => string;
  className?: string;
  /** Delay before counting starts, for staggering several figures. */
  delay?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts a number up when it first renders, and re-counts from the old value
 * to the new one whenever it changes — so points earned mid-session tick up
 * rather than snapping.
 *
 * Driven by requestAnimationFrame rather than a CSS transition because the
 * thing being animated is text content, not a style. One rAF loop per
 * instance, cancelled on unmount, and skipped entirely under reduced motion.
 */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  format,
  className,
  delay = 0
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const fromRef = useRef(reduced ? value : 0);
  const frameRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Reduced motion: land on the value immediately, every time.
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;

    if (delta === 0) {
      setDisplay(value);
      return;
    }

    // A big delta should not mean a long animation.
    const span = Math.min(duration, 400 + Math.abs(delta) * 6);
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / span);
      setDisplay(from + delta * easeOutCubic(t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    timeoutRef.current = setTimeout(() => {
      frameRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Leaving mid-tween would strand the next run at a fractional start.
      fromRef.current = value;
    };
  }, [value, duration, delay, reduced]);

  const rounded = decimals > 0
    ? Number(display.toFixed(decimals))
    : Math.round(display);

  return (
    <span className={className} aria-label={format ? format(value) : String(value)}>
      {format ? format(rounded) : rounded.toLocaleString()}
    </span>
  );
}
