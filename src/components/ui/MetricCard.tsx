import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

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
}

export function MetricCard({ label, value, trend, icon, tooltip, note, onClick }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden p-4 sm:p-5 bg-surface border border-border/10 rounded-2xl flex flex-col gap-2.5 transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer active:bg-surface-alt/80 hover:border-border/20' : ''
      }`}
    >
      {/* Decorative dynamic top overlay dot */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-radial from-primary/10 to-transparent rounded-full pointer-events-none opacity-40" />

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
          <div className="w-8 h-8 rounded-xl bg-surface-alt/70 border border-border/5 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-none">
          {value}
        </span>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            trend.direction === 'up' 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : 'bg-rose-500/10 text-rose-500'
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
