import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

type MetricTone = 'rank-gold' | 'rank-silver' | 'rank-bronze' | 'xp';

/**
 * Reward-palette classes per tone, spelled out as complete static strings
 * rather than built from a template literal — Tailwind's scanner can't see
 * `bg-${tone}` (see the pastel-restyle conversion notes: it silently
 * compiles to nothing).
 */
const TONE_CHIP: Record<MetricTone, string> = {
  'rank-gold': 'bg-rank-gold/15 text-rank-gold-ink',
  'rank-silver': 'bg-rank-silver/15 text-rank-silver-ink',
  'rank-bronze': 'bg-rank-bronze/15 text-rank-bronze-ink',
  xp: 'bg-xp/15 text-xp-ink'
};
const TONE_GLOW: Record<MetricTone, string> = {
  'rank-gold': 'from-rank-gold/10',
  'rank-silver': 'from-rank-silver/10',
  'rank-bronze': 'from-rank-bronze/10',
  xp: 'from-xp/10'
};
const TONE_BORDER: Record<MetricTone, string> = {
  'rank-gold': 'border-rank-gold/25',
  'rank-silver': 'border-rank-silver/25',
  'rank-bronze': 'border-rank-bronze/25',
  xp: 'border-xp/25'
};
const TONE_VALUE: Record<MetricTone, string> = {
  'rank-gold': 'text-rank-gold-ink',
  'rank-silver': 'text-rank-silver-ink',
  'rank-bronze': 'text-rank-bronze-ink',
  xp: 'text-xp-ink'
};

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down' };
  icon?: React.ReactNode;
  tooltip?: string;
  /** Muted supporting line under the value — context the number alone lacks
   *  ("Top 5% of 240 learners"). Omit it and the card keeps its old shape. */
  note?: string;
  onClick?: () => void;
  /** Reward-palette accent for the icon chip + glow. Omit for routine
   *  metrics — colour is spent only on wins/ranks, never decoratively. */
  tone?: MetricTone;
  /** One-shot diagonal shine on mount (the shared `.motion-shine` primitive)
   *  plus a tone-tinted value — for the one stat that should read as an
   *  earned badge rather than a plain measurement. Reduced motion is
   *  handled globally in motion.css. */
  celebrate?: boolean;
  /** Heavier padding, shadow and a tone-tinted ring — for the card in a row
   *  that should outrank its neighbours rather than sit flush with them. */
  emphasis?: boolean;
}

export function MetricCard({ label, value, trend, icon, tooltip, note, onClick, tone, celebrate, emphasis }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const chipClasses = tone ? TONE_CHIP[tone] : 'bg-surface-alt/70 border border-border/5 text-primary';
  const borderClasses = emphasis && tone ? TONE_BORDER[tone] : 'border-border/10';

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden bg-surface border rounded-2xl flex flex-col gap-2.5 transition-all duration-200 select-none ${
        emphasis ? 'p-5 sm:p-6 shadow-[var(--shadow-card)]' : 'p-4 sm:p-5'
      } ${borderClasses} ${onClick ? 'cursor-pointer active:bg-surface-alt/80 hover:border-border/20' : ''} ${
        celebrate ? 'motion-shine' : ''
      }`}
    >
      {/* Decorative dynamic top overlay dot */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-radial ${tone ? TONE_GLOW[tone] : 'from-primary/10'} to-transparent rounded-full pointer-events-none opacity-40`} />

      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
          {label}
          {tooltip && (
            <span 
              className="relative cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
            >
              <HelpCircle size={12} className="text-text-muted hover:text-primary transition-colors" />
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-50 bottom-5 left-1/2 -translate-x-1/2 w-48 p-2 bg-background border border-border/20 text-[11px] font-medium leading-normal text-text-main rounded-xl shadow-2xl backdrop-blur-md"
                  >
                    {tooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${chipClasses}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${
          celebrate && tone ? TONE_VALUE[tone] : 'text-text-main'
        }`}>
          {value}
        </span>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            trend.direction === 'up' 
              ? 'bg-accent/10 text-accent' 
              : 'bg-brand-pink/10 text-brand-pink'
          }`}>
            {trend.direction === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      {note && (
        <p className="text-[11px] font-medium text-text-muted leading-snug -mt-1">
          {note}
        </p>
      )}
    </motion.div>
  );
}
