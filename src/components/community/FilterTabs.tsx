import React from 'react';

interface FilterTabsProps {
  activeFilter: string;
  onChange: (filter: string) => void;
}

const TABS = ["All", "PDF", "Notes", "Flashcards", "Videos"];

export function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex gap-2 py-1 select-none">
        {TABS.map((tab) => {
          const isActive = activeFilter.toLowerCase() === tab.toLowerCase();
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              id={`comm-tab-${tab.toLowerCase()}`}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shrink-0 min-h-[44px] flex items-center justify-center outline-none cursor-pointer ${
                isActive
                  ? "text-white bg-primary"
                  : "text-text-muted bg-surface border border-border/5 active:bg-surface/60"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
