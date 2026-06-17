import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { useAppContext } from '../../context/AppContext';

export function PointsDisplay() {
  const { user } = useAppContext();
  const [points, setPoints] = useState(user?.points || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // We already have points from user context potentially, 
    // but the Shop specifically tracks inventory.points which might be more up-to-date for spender.
    fetchPoints();
    
    // Custom event listener for real-time point updates
    const handlePointsUpdate = (event: any) => {
      setPoints(event.detail.newTotal);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    };

    window.addEventListener('aether-points-updated', handlePointsUpdate);
    return () => window.removeEventListener('aether-points-updated', handlePointsUpdate);
  }, []);

  // Update points when user context changes if not currently animating (to avoid jumping during purchase)
  useEffect(() => {
    if (!isAnimating && user?.points !== undefined) {
      setPoints(user.points);
    }
  }, [user?.points, isAnimating]);

  const fetchPoints = async () => {
    try {
      const res = await api.get('/shop/points');
      if (res.data.success) {
        setPoints(res.data.points);
      }
    } catch (err) {
      console.error('Failed to fetch points', err);
    }
  };

  return (
    <div className="relative group">
      <motion.div 
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        className="flex items-center gap-3 px-4 py-2.5 bg-[#141A24]/80 backdrop-blur-xl rounded-2xl border border-[#6C5CE7]/30 shadow-[0_0_20px_rgba(108,92,231,0.1)] group-hover:border-[#6C5CE7]/60 transition-all duration-500"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00D2FF] flex items-center justify-center shadow-lg">
           <Zap size={16} className="text-white fill-white/20" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">Aether Balance</span>
          <div className="flex items-baseline gap-1">
             <span className="text-lg font-black text-white leading-none tracking-tight">
               {points.toLocaleString()}
             </span>
             <Sparkles size={10} className={cn("text-[#00D2FF] transition-all", isAnimating ? "animate-spin opacity-100" : "opacity-0")} />
          </div>
        </div>
      </motion.div>

      {/* Decorative particles on animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <span className="text-xs font-black text-[#00D2FF] bg-[#141A24] px-2 py-1 rounded-full border border-[#00D2FF]/30 shadow-lg">
              +POINTS
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
