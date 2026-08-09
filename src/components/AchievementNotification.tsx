import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Star, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { celebrate } from '../lib/motion';
import { pastelForCategory } from '../lib/utils';

interface UnlockedEventData {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  icon?: string;
}

export const AchievementNotification: React.FC = () => {
  const [activeNotification, setActiveNotification] = useState<UnlockedEventData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnlock = (event: any) => {
      const data = event.detail as UnlockedEventData;
      if (!data) return;

      setActiveNotification(data);

      // Themed burst from the shared motion layer: reads the live theme
      // tokens, lazy-loads canvas-confetti, and no-ops under reduced motion.
      // Replaces a hardcoded five-hex palette that ignored the theme.
      void celebrate('win', { x: 0.5, y: 0.8 });
    };

    window.addEventListener('achievement:unlocked', handleUnlock);
    return () => {
      window.removeEventListener('achievement:unlocked', handleUnlock);
    };
  }, []);

  // Auto Dismiss
  useEffect(() => {
    if (activeNotification) {
      const t = setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [activeNotification]);

  const viewAchievements = () => {
    setActiveNotification(null);
    navigate('/achievements');
  };

  if (!activeNotification) return null;

  // The same five neon hexes this component used to carry, now the one shared
  // pastel scale keyed by category — matching the badge grid and the category
  // rail on the Achievements page, so an unlock toast is recognisably the same
  // colour as the badge it is announcing.
  const tone = pastelForCategory(activeNotification.category);
  const tint = `var(--pastel-${tone})`;
  const ink = `var(--pastel-${tone}-ink)`;

  return (
    <AnimatePresence>
      <div className="fixed bottom-22 left-4 right-4 z-[99999] pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface h-20 border border-border shadow-[var(--shadow-card-hover)] p-3 flex items-center justify-between gap-3 pointer-events-auto relative overflow-hidden"
        >
          {/* Category strip — was a five-branch nested ternary of raw hexes. */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: ink }} />

          {/* Left Icon badge */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tint, color: ink }}
          >
            <Trophy size={20} />
          </div>

          {/* Texts */}
          <div className="flex-grow min-w-0" onClick={viewAchievements}>
            <p className="text-[11px] font-black uppercase tracking-widest text-primary leading-none mb-1">Badge Unlocked!</p>
            <h5 className="font-extrabold text-sm text-text-main truncate leading-tight">{activeNotification.title}</h5>
            <p className="text-[11px] text-text-muted truncate leading-none mt-1">+{activeNotification.points} study points earned</p>
          </div>

          {/* View Badge button */}
          <button 
            onClick={viewAchievements}
            className="flex-shrink-0 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
          >
            View
          </button>

          {/* Close indicator */}
          <button 
            onClick={() => setActiveNotification(null)}
            className="text-text-muted hover:text-text-main p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
