import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Star, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

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

      try {
        // Trigger high quality canvas confetti celebration
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#F5B042', '#6C5CE7', '#00E5A0', '#00D2FF', '#FF5E7E']
        });
      } catch (e) {
        console.warn('Confetti fail:', e);
      }
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

  const getStyle = (category: string) => {
    switch (category) {
      case 'streak': return { border: 'border-[#F5B042]/50', bg: 'bg-[#F5B042]/10', text: 'text-[#F5B042]' };
      case 'time': return { border: 'border-[#6C5CE7]/50', bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7]' };
      case 'quiz': return { border: 'border-[#00E5A0]/50', bg: 'bg-[#00E5A0]/10', text: 'text-[#00E5A0]' };
      case 'material': return { border: 'border-[#00D2FF]/50', bg: 'bg-[#00D2FF]/10', text: 'text-[#00D2FF]' };
      case 'social': return { border: 'border-[#FF5E7E]/50', bg: 'bg-[#FF5E7E]/10', text: 'text-[#FF5E7E]' };
      default: return { border: 'border-primary/50', bg: 'bg-primary/10', text: 'text-primary' };
    }
  };

  if (!activeNotification) return null;

  const style = getStyle(activeNotification.category);

  return (
    <AnimatePresence>
      <div className="fixed bottom-22 left-4 right-4 z-[99999] pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15 }}
          className={`w-full max-w-sm rounded-[24px] bg-surface h-20 border ${style.border} shadow-soft p-3 flex items-center justify-between gap-3 pointer-events-auto relative overflow-hidden backdrop-blur-md`}
        >
          {/* Accent lighting strip */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activeNotification.category === 'streak' ? 'bg-[#F5B042]' : activeNotification.category === 'time' ? 'bg-[#6C5CE7]' : activeNotification.category === 'quiz' ? 'bg-[#00E5A0]' : activeNotification.category === 'material' ? 'bg-[#00D2FF]' : 'bg-[#FF5E7E]'}`} />

          {/* Left Icon badge */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
            <Trophy size={20} />
          </div>

          {/* Texts */}
          <div className="flex-grow min-w-0" onClick={viewAchievements}>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Badge Unlocked!</p>
            <h5 className="font-extrabold text-sm text-text-main truncate leading-tight">{activeNotification.title}</h5>
            <p className="text-[10px] text-text-muted truncate leading-none mt-1">+{activeNotification.points} study points earned</p>
          </div>

          {/* View Badge button */}
          <button 
            onClick={viewAchievements}
            className="flex-shrink-0 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer"
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
