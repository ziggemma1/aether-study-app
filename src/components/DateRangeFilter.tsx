import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  currentPeriod: 'week' | 'month' | 'all';
  onChange: (period: 'week' | 'month' | 'all') => void;
}

export default function DateRangeFilter({ currentPeriod, onChange }: DateRangeFilterProps) {
  const options = [
    { value: 'week' as const, label: 'This Week' },
    { value: 'month' as const, label: 'This Month' },
    { value: 'all' as const, label: 'All Time' }
  ];

  return (
    <div className="flex items-center gap-1.5 bg-[#0B0E14] p-1 rounded-xl border border-white/5 shadow-inner">
      {options.map((opt) => {
        const isActive = currentPeriod === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
              isActive
                ? 'bg-[#141A24] text-[#00D2FF] border border-white/5 shadow-md shadow-black/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
