import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  type: 'streak' | 'quiz' | 'achievement' | 'levelup';
  onComplete?: () => void;
}

export function CelebrationEffect({ type, onComplete }: CelebrationEffectProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getContent = () => {
    switch (type) {
      case 'streak':
        return {
          icon: '🔥',
          title: 'Streak Milestone!',
          message: "You're on fire! Keep up the daily momentum!",
          colorClass: 'text-amber-500 border-l-amber-500',
          bgAccent: 'rgba(245, 176, 66, 0.1)'
        };
      case 'quiz':
        return {
          icon: '🏆',
          title: 'Quiz Master!',
          message: 'Excellent job! You successfully completed the recall study!',
          colorClass: 'text-emerald-500 border-l-emerald-500',
          bgAccent: 'rgba(16, 185, 129, 0.1)'
        };
      case 'achievement':
        return {
          icon: '🎖️',
          title: 'Achievement Unlocked!',
          message: 'New milestone badge added to your user profile.',
          colorClass: 'text-purple-500 border-l-purple-500',
          bgAccent: 'rgba(139, 92, 246, 0.1)'
        };
      case 'levelup':
        return {
          icon: '✨',
          title: 'Level Up!',
          message: 'New academic level unlocked. Keep soaring high!',
          colorClass: 'text-cyan-500 border-l-cyan-500',
          bgAccent: 'rgba(6, 182, 212, 0.1)'
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="achievement-unlock fixed bottom-20 left-4 right-4 z-50 p-4 border border-border/20 shadow-2xl rounded-2xl flex items-center gap-3"
          style={{ 
            borderLeftWidth: '5px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: content.bgAccent }}>
            {content.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-black uppercase tracking-wider ${content.colorClass}`}>
              {content.title}
            </h4>
            <p className="text-xs text-text-muted mt-0.5 truncate pr-2">
              {content.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
