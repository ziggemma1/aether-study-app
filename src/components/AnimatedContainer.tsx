import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 }
};

const pageTransition = {
  duration: 0.25,
  ease: "easeOut"
};

export function AnimatedContainer({ children }: AnimatedContainerProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition as any}
        /*
         * `[&>*]:w-full` is load-bearing, not cosmetic.
         *
         * This is a COLUMN flex container, so each page root is a flex item.
         * Most page roots are `max-w-… mx-auto` — and in flexbox an auto margin
         * on the cross axis CANCELS `align-items: stretch`. The page therefore
         * stops taking the container's width and sizes to fit-content instead,
         * which on a page with wide controls resolves far past the viewport
         * (Explore measured 1010px inside a 768px viewport). `main` has
         * overflow-x-hidden, so the excess was silently clipped rather than
         * scrollable: headings just ended mid-word on tablet and phone.
         *
         * Giving children a definite width restores stretch behaviour while
         * still letting `max-w-… mx-auto` centre them on wide screens.
         *
         * `[&>*]:shrink-0` is the vertical twin, and matters just as much.
         * This box is `flex-grow`, so it is exactly `main`'s content height —
         * one viewport minus padding. A page root is a flex item, and flex
         * items default to `flex-shrink: 1`, so a tall page was being SQUASHED
         * to that height while its own children kept their real size and spilled
         * out the bottom. The spilled content painted over main's bottom padding
         * and ended up under the floating BottomNav, and no amount of padding on
         * main could fix it because the overflow was not part of main's scroll
         * height. With shrink disabled the page keeps its content height, main
         * scrolls properly, and the padding does its job.
         *
         * Related: pages inside the shell must use `min-h-full` (100% of this
         * box), never `min-h-screen` — a hard 100vh cannot fit and overflows the
         * same way. Routes rendered OUTSIDE AppLayout (login, signup,
         * /share/:token) are not flex items here and keep `min-h-screen`.
         */
        className="flex-grow shrink-0 flex flex-col w-full min-w-0 [&>*]:w-full [&>*]:min-w-0 [&>*]:shrink-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
