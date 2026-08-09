import { celebrate } from '../lib/motion';

/**
 * Confetti for win moments.
 *
 * Delegates to the shared motion layer rather than calling canvas-confetti
 * directly, which fixes three things this hook used to have:
 *
 *  - `fireConfetti` ran a 3-second setInterval firing two bursts every 250ms,
 *    roughly 24 bursts and ~1,200 particles. That is a fireworks show, and on
 *    a budget phone it is a sustained main-thread cost during the exact moment
 *    the results screen is trying to animate in. It is now one burst.
 *  - `burstConfetti` carried three hardcoded hexes that ignored the theme.
 *    Colour now comes from the live theme tokens.
 *  - Neither respected prefers-reduced-motion. celebrate() no-ops when it is set.
 *
 * The API is unchanged so existing call sites did not need touching.
 */
export function useConfetti() {
  /** Bigger moment: quiz passed, milestone reached. */
  const fireConfetti = () => {
    void celebrate('milestone');
  };

  /** Smaller moment: a single correct answer, a card flipped. */
  const burstConfetti = () => {
    void celebrate('win', { x: 0.5, y: 0.6 });
  };

  return { fireConfetti, burstConfetti };
}
