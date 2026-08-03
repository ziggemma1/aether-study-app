import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { useNavigate } from 'react-router-dom';
import { getMasteryColor } from '../../lib/utils';

interface TodaysFocusProps {
  materials: LibraryMaterial[];
}

export function TodaysFocus({ materials }: TodaysFocusProps) {
  const navigate = useNavigate();

  // Pick up to 2 items that have mastery < 80% (low mastery)
  const focusItems = React.useMemo(() => {
    return materials
      .filter((m) => !m.mastery || m.mastery < 80)
      // Sort by mastery levels in ascending order so lowest mastery gets prioritized
      .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
      .slice(0, 2);
  }, [materials]);

  // If there are no materials uploaded yet or loading
  if (materials.length === 0) {
    return null; // Don't show anything yet, let empty library state handle it
  }

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-alt/90 to-surface/90 p-5 border border-[#6C5CE7]/15 shadow-xl select-none"
    >
      {/* Decorative Warm Backglow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#6C5CE7]/10 blur-3xl pointer-events-none" />

      {/* Header Info. Was brand pink, which bought a fifth accent on a screen
          where nothing already read as primary — and matched neither the card's
          own violet backglow nor anything it was trying to say. */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
        <h3 className="text-xs font-bold uppercase text-[#6C5CE7] tracking-widest">
          Today's Recommendation Focus
        </h3>
      </div>

      <div className="px-1">
        <h4 className="text-sm font-bold text-text-main tracking-tight leading-snug">
          Recommended daily reviews to boost your academic goals
        </h4>
        <p className="text-xs text-text-muted/85 mt-1 leading-relaxed">
          Based on cognitive interval recall, studying these items now increases long-term retention.
        </p>
      </div>

      {/* Focus Items List */}
      <div className="mt-4 space-y-3">
        {focusItems.length > 0 ? (
          focusItems.map((item) => {
            const mastery = item.mastery || 0;
            return (
              <div
                key={item.id}
                onClick={() => navigateTo(`/library/${item.id}`)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-background/60 border border-border active:bg-background/95 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] font-semibold text-lg">
                    📚
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-main truncate leading-tight group-hover:text-[#6C5CE7] transition-colors pr-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* This badge is identical on every row, so it carried no
                          information — only alarm-red weight. Neutral chrome
                          here; the colour moves to mastery, which does vary. */}
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-text-muted/10 text-text-muted">
                        Review Focus
                      </span>
                      <span
                        className="text-[11px] font-medium font-mono"
                        style={{ color: getMasteryColor(mastery) }}
                      >
                        {mastery}% Mastery
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo(`/quiz/${item.id}`);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C5CE7] text-white text-[11px] font-bold uppercase transition-all hover:bg-[#6C5CE7]/90 cursor-pointer"
                  >
                    Take Quiz
                  </button>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-text-main transition-colors" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#00E5A0]/5 border border-[#00E5A0]/10 text-[#00E5A0]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-text-main">
                All study courses at peak mastery!
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Stellar progress, scholar! You have mastered 100% of your materials. Keep adding folders to your hub!
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
