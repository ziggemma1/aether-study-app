import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CelebrationEffect } from './CelebrationEffect';

interface StreakCounterProps {
  days: number;
  onStreakUpdate?: (newDays: number) => void;
}

export function StreakCounter({ days, onStreakUpdate }: StreakCounterProps) {
  const [animate, setAnimate] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevDays, setPrevDays] = useState(days);

  useEffect(() => {
    if (days > prevDays) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 500);
      
      // Celebrate milestone streaks
      if (days === 1 || days === 3 || days === 7 || days === 15 || days === 30) {
        setShowCelebration(true);
      }
      
      setPrevDays(days);
      return () => clearTimeout(t);
    }
  }, [days, prevDays]);

  return (
    <>
      <motion.div 
        animate={animate ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="streak-container flex items-center gap-2.5 bg-surface-alt/70 border border-amber-500/20 px-4 py-2 rounded-2xl shadow-soft"
      >
        <span className="text-xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] animate-pulse">🔥</span>
        <div>
          <div className="text-sm font-black text-amber-500 leading-none">{days} Days</div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">Study Streak</div>
        </div>
      </motion.div>
      
      {showCelebration && (
        <CelebrationEffect type="streak" onComplete={() => setShowCelebration(false)} />
      )}
    </>
  );
}
