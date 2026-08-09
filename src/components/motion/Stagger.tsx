import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion, motionVariants } from '../../lib/motion';

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Animate when scrolled into view instead of on mount. */
  whenInView?: boolean;
}

/**
 * Entrance animation for a list or grid: children fade and rise in sequence.
 *
 * Under reduced motion the variants collapse to zero-duration, so children
 * are simply present — no fade, no travel, no delay. Not conditionally
 * unmounted, so the DOM is identical either way.
 */
export function StaggerList({ children, className, whenInView = false }: StaggerProps) {
  const reduced = useReducedMotion();
  const v = motionVariants(reduced);

  const trigger = whenInView
    ? { whileInView: 'show', viewport: { once: true, amount: 0.15 } }
    : { animate: 'show' };

  return (
    <motion.div
      className={className}
      variants={v.staggerContainer}
      initial="hidden"
      {...trigger}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

/** One child of a StaggerList. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduced = useReducedMotion();
  const v = motionVariants(reduced);

  return (
    <motion.div className={className} variants={v.staggerItem}>
      {children}
    </motion.div>
  );
}
