import React from 'react';
import { motion } from 'framer-motion';

interface DateRangeFilterProps {
  value: 'week' | 'month' | 'all';
  onChange: (value: 'week' | 'month' | 'all') => void;
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const options = [
    { label: 'Weekly', value: 'week' as const },
    { label: 'Monthly', value: 'month' as const },
    { label: 'All Time', value: 'all' as const }
  ];

  return (
    <div 
      className="flex items-center gap-1.5 bg-surface-alt/80 p-1 border border-border/10 rounded-2xl w-full"
      id="id-date-range-filter-container"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 select-none cursor-pointer focus:outline-none min-h-[44px] flex items-center justify-center ${
            value === opt.value 
              ? 'text-white' 
              : 'text-text-muted hover:text-text-main'
          }`}
          id={`id-filter-btn-${opt.value}`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="activeFilterTab"
              className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl"
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
