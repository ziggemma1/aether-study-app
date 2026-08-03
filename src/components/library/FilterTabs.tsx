import React from 'react';

interface FilterTabsProps {
  activeFilter: string;
  onChange: (filter: string) => void;
}

const TABS = ["All", "PDF", "Notes", "Videos", "Quizzes"];

export function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  // The row scrolls but `no-scrollbar` hides the only clue that it does, so at
  // 390px "Videos" just looked severed. These drive a fade on whichever edge
  // still has content behind it.
  const [overflow, setOverflow] = React.useState({ start: false, end: false });

  const measure = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({
      start: el.scrollLeft > 1,
      end: max > 1 && el.scrollLeft < max - 1,
    });
  }, []);

  React.useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={measure}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth"
      >
        <div className="flex gap-2 py-1 select-none">
          {TABS.map((tab) => {
            const isActive = activeFilter.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => onChange(tab)}
                id={`tab-${tab.toLowerCase()}`}
                aria-pressed={isActive}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shrink-0 min-h-[44px] flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E14] ${
                  isActive
                    ? "text-[#F0F3F8] bg-[#6C5CE7]"
                    : "text-[#8E9AAF] bg-[#141A24] border border-[#8E9AAF]/10 hover:text-[#F0F3F8] active:bg-[#141A24]/60"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#141A24] to-transparent transition-opacity duration-200 ${
          overflow.start ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#141A24] to-transparent transition-opacity duration-200 ${
          overflow.end ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
