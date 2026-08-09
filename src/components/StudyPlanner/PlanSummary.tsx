import React from 'react';
import { Flame, Loader2, Sparkles, Eye, BookOpen, Clock, Target, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlanSummaryProps {
  duration: number;
  commitment: number;
  selectedMaterialsCount: number;
  goal: string;
  complexity: string;
  isGenerating: boolean;
  onGenerate: () => void;
  onPreviewExample: () => void;
}

export default function PlanSummary({
  duration,
  commitment,
  selectedMaterialsCount,
  goal,
  complexity,
  isGenerating,
  onGenerate,
  onPreviewExample,
}: PlanSummaryProps) {
  // Total hours calculate
  const totalHours = Math.round(((duration * commitment) / 60) * 10) / 10;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] relative overflow-hidden">
      {/* Background glow dots */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-sm font-extrabold text-text-main flex items-center gap-2 mb-4 pb-3 border-b border-border">
        {/* The flame no longer pulses forever: a permanent animation next to a
            static summary is motion that conveys nothing. */}
        <Flame className="w-5 h-5 text-primary" />
        Your plan at a glance
      </h3>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="block text-[11px] text-text-muted">Total time</span>
            <span className="text-sm font-bold text-text-main">~{totalHours} hours</span>
          </div>
        </div>

        <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-secondary shrink-0" />
          <div>
            <span className="block text-[11px] text-text-muted">Materials</span>
            <span className="text-sm font-bold text-text-main">
              {selectedMaterialsCount === 0 ? 'None selected' : `${selectedMaterialsCount} selected`}
            </span>
          </div>
        </div>

        <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-3">
          <Target className="w-4 h-4 text-accent shrink-0" />
          <div>
            <span className="block text-[11px] text-text-muted">Goal</span>
            <span className="text-sm font-bold text-text-main block min-w-0 truncate">
              {goal}
            </span>
          </div>
        </div>

        <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-text-muted shrink-0" />
          <div>
            <span className="block text-[11px] text-text-muted">Difficulty</span>
            <span className="text-sm font-bold text-text-main block min-w-0 truncate">
              {complexity}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            "flex-grow h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer select-none",
            isGenerating
              ? "bg-primary/50 text-text-muted border border-border cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white shadow-primary/15"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Building your plan…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Create my plan</span>
            </>
          )}
        </button>

        <button
          onClick={onPreviewExample}
          type="button"
          className="px-4 h-12 bg-surface/40 hover:bg-surface border border-border text-text-muted rounded-xl text-sm font-semibold hover:text-text-main transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px]"
        >
          <Eye className="w-4 h-4" />
          <span>See an example</span>
        </button>
      </div>
    </div>
  );
}
