import { useEffect, useRef, useState, type ReactNode } from 'react';
import { celebrate, useReducedMotion, type CelebrationKind } from '../../lib/motion';

interface PopOnChangeProps {
  /** Pops whenever this changes to a new truthy-different value. */
  trigger: unknown;
  children: ReactNode;
  className?: string;
  /** Fire a confetti burst from this element too. */
  confetti?: CelebrationKind | false;
  /** Skip the very first render, so arriving at a page is not a celebration. */
  skipInitial?: boolean;
}

/**
 * Wraps content and plays the `motion-pop` keyframe whenever `trigger`
 * changes — the "you did it" beat for a badge unlocking, a streak extending
 * or points landing.
 *
 * Non-blocking by design: nothing overlays the UI and nothing waits for the
 * animation. Under reduced motion the class is never applied and celebrate()
 * no-ops, so the child just re-renders.
 */
export function PopOnChange({
  trigger,
  children,
  className,
  confetti = false,
  skipInitial = true
}: PopOnChangeProps) {
  const reduced = useReducedMotion();
  const [popping, setPopping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const prev = useRef(trigger);

  useEffect(() => {
    const changed = prev.current !== trigger;
    prev.current = trigger;

    if (first.current) {
      first.current = false;
      if (skipInitial) return;
    }
    if (!changed) return;
    if (reduced) return;

    setPopping(true);
    if (confetti) void celebrate(confetti, ref.current);

    // Matches --motion-slow; clearing the class lets it replay next time.
    const t = setTimeout(() => setPopping(false), 600);
    return () => clearTimeout(t);
  }, [trigger, confetti, reduced, skipInitial]);

  return (
    <div ref={ref} className={`${className || ''} ${popping ? 'motion-pop' : ''}`.trim()}>
      {children}
    </div>
  );
}
