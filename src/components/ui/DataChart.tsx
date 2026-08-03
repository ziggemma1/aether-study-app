import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface DataPoint {
  label: string; // S M T W T F S
  value: number; // e.g. hours or focus metric
  active?: boolean;
}

interface DataChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  maxValue?: number;
  emptyTitle?: string;
  emptyHint?: string;
}

export function DataChart({
  data,
  title,
  subtitle,
  maxValue = 4,
  emptyTitle = 'No study time logged this week',
  emptyHint = 'Start a session and your daily minutes will chart here.',
}: DataChartProps) {
  const max = Math.max(...data.map(d => d.value), maxValue, 1);
  // Every bar got a `Math.max(percentage, 8)` floor, so a week with no sessions
  // drew seven identical stubs in outlined tracks — indistinguishable from a
  // chart that failed to load. Say there's no data instead of miming data.
  const isEmpty = data.length === 0 || data.every(d => d.value === 0);

  return (
    <div className="p-4 sm:p-5 bg-surface border border-border/10 rounded-2xl flex flex-col gap-3 select-none">
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-text-muted">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-[11px] text-primary/80 font-bold mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <span className="text-[11px] font-bold text-text-muted px-2 py-0.5 rounded-md bg-surface-alt/60">
            Past 7 Days
          </span>
        </div>
      )}

      {/* Chart bars body */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center gap-1 pt-3 h-28">
          <BarChart3 size={22} className="text-text-muted/40" aria-hidden />
          <p className="text-xs font-semibold text-text-main/80">{emptyTitle}</p>
          <p className="text-[11px] text-text-muted max-w-[32ch] leading-snug">{emptyHint}</p>
        </div>
      ) : (
      <div className="flex items-end justify-between gap-2.5 pt-3 h-28">
        {data.map((point, idx) => {
          const percentage = (point.value / max) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              {/* Tooltip trigger hover effect */}
              <div className="relative w-full flex justify-center">
                <div className="absolute bottom-full mb-1 bg-neutral-900 border border-border/10 text-white text-[11px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10 z-index-top">
                  {point.value}h
                </div>
              </div>

              {/* Bar outer track */}
              <div className="w-full bg-surface-alt rounded-lg h-full max-h-[80px] flex items-end overflow-hidden ring-1 ring-white/5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: point.value === 0 ? '0%' : `${Math.max(percentage, 8)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                  className={`w-full rounded-b-md transition-all duration-300 ${
                    point.active 
                      ? 'bg-gradient-to-t from-primary to-cyan-400 shadow-[0_0_12px_rgba(108,92,231,0.3)]' 
                      : 'bg-primary/25 hover:bg-primary/45'
                  }`}
                />
              </div>

              {/* Label underneath */}
              <span className={`text-[11px] font-black uppercase tracking-wider ${
                point.active ? 'text-primary' : 'text-text-muted'
              }`}>
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
