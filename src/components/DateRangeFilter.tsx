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
    /* Inverted for paper: the track is the recessed tint and the ACTIVE
       segment is the raised white one. It used to be the other way round —
       near-black track, dark active chip, neon cyan label — which stayed a
       solid black pill on the bright Reports page. The active label is
       text-main rather than an accent; the raised surface already marks it. */
    <div
      className="inline-flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border"
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = currentPeriod === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-surface text-text-main shadow-[var(--shadow-card)]'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
