import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles, Snowflake, ArrowRight } from 'lucide-react';
import StreakFlame from './StreakFlame';

interface StreakFlameIndicatorProps {
  days: number;
  studiedToday: boolean;
  onClick?: () => void;
  onActionClick?: () => void;
}

export default function StreakFlameIndicator({ 
  days, 
  studiedToday, 
  onClick,
  onActionClick 
}: StreakFlameIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isCold = !studiedToday;
  const isBlazing = studiedToday && days >= 3;
  const isWarm = studiedToday && days < 3;

  // Decide card background colors based on streak temperature
  let bgClasses = "bg-surface border-border/10";
  let borderGlow = "";
  
  if (days > 0) {
    if (isCold) {
      bgClasses = "bg-slate-500/5 border-slate-500/20";
    } else if (isBlazing) {
      bgClasses = "bg-amber-500/5 border-amber-500/20";
      borderGlow = "shadow-[0_0_15px_rgba(245,158,11,0.06)]";
    } else if (isWarm) {
      bgClasses = "bg-orange-500/5 border-orange-500/10";
    }
  }

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden p-4 bg-surface border rounded-2xl flex flex-col justify-between transition-all duration-200 select-none min-h-[96px] ${bgClasses} ${borderGlow} ${
        onClick ? 'cursor-pointer active:bg-surface-alt/80 hover:border-border/20' : ''
      }`}
      id="streak-flame-metric-card"
    >
      {/* Decorative localized overlay glow */}
      {isBlazing && (
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-radial from-amber-500/15 to-transparent rounded-full pointer-events-none opacity-60" />
      )}
      {isCold && days > 0 && (
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-radial from-[#38BDF8]/10 to-transparent rounded-full pointer-events-none opacity-40" />
      )}

      {/* Header Label and Help Tooltip */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
          Recall Streak
          <span 
            className="relative cursor-help shrink-0"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
          >
            <HelpCircle size={11} className="text-text-muted hover:text-primary transition-colors" />
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-50 bottom-5 left-1/2 -translate-x-1/2 w-48 p-2 bg-[#0F172A]/95 border border-border/20 text-[11px] font-medium leading-normal text-text-main rounded-xl shadow-2xl backdrop-blur-md"
                >
                  Consecutive active recall study days. Maintaining streaks boosts study constellation brightness.
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        </span>

        {/* State Badge indication */}
        {days > 0 ? (
          isCold ? (
            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/10 flex items-center gap-0.5 animate-pulse uppercase tracking-wider">
              <Snowflake size={7} /> COOLING
            </span>
          ) : isBlazing ? (
            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 flex items-center gap-0.5 uppercase tracking-wider">
              <Sparkles size={7} /> BLAZING
            </span>
          ) : (
            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/10 flex items-center gap-0.5 uppercase tracking-wider">
              🔥 ACTIVE
            </span>
          )
        ) : null}
      </div>

      {/* Main Row: Value & Beautiful Visual Flame */}
      <div className="flex items-center justify-between gap-3 mt-1.5">
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-black text-text-main tracking-tight leading-none">
            {days > 0 ? `${days} Days` : 'Unkindled'}
          </span>
          {days > 0 ? (
            <span className="text-[11px] text-text-muted font-bold mt-1 uppercase tracking-wider">
              {isCold ? 'Studies frozen today' : 'Consistently learning!'}
            </span>
          ) : (
            <span className="text-[11px] text-amber-500 font-bold mt-1 uppercase tracking-wider">
              No active streak
            </span>
          )}
        </div>

        {/* The Streak Flame graphic element */}
        {days > 0 ? (
          <StreakFlame days={days} studiedToday={studiedToday} size={50} />
        ) : (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onActionClick) onActionClick();
            }}
            className="w-10 h-10 rounded-xl bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 flex items-center justify-center text-amber-500 cursor-pointer transition-all shrink-0 group"
          >
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>

      {/* Warning CTA when cooling down */}
      {days > 0 && isCold && (
        <div className="mt-2 text-[7px] text-[#38BDF8] border-t border-slate-500/10 pt-1.5 flex items-center justify-between">
          <span>Heat up streak now</span>
          <ArrowRight size={8} />
        </div>
      )}
    </motion.div>
  );
}
