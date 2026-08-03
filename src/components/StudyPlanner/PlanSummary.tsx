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
    <div className="bg-[#141A24] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background glow dots */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C5CE7]/5 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-sm font-extrabold text-[#F0F3F8] flex items-center gap-2 mb-4 pb-3 border-b border-gray-800/65">
        <Flame className="w-5 h-5 text-[#6C5CE7] animate-pulse" />
        Syllabus Plan Summary
      </h3>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-[#0B0E14] border border-gray-800/80 p-3 rounded-xl flex items-center gap-3">
          <Clock className="w-4 h-4 text-[#6C5CE7] shrink-0" />
          <div>
            <span className="block text-[11px] text-gray-500 uppercase font-mono">Total Time</span>
            <span className="text-xs font-extrabold text-[#F0F3F8]">~{totalHours} Hours</span>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-gray-800/80 p-3 rounded-xl flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-[#00D2FF] shrink-0" />
          <div>
            <span className="block text-[11px] text-gray-500 uppercase font-mono">Materials</span>
            <span className="text-xs font-extrabold text-[#F0F3F8]">
              {selectedMaterialsCount} checked
            </span>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-gray-800/80 p-3 rounded-xl flex items-center gap-3">
          <Target className="w-4 h-4 text-[#00E5A0] shrink-0" />
          <div>
            <span className="block text-[11px] text-gray-500 uppercase font-mono">Goal Focus</span>
            <span className="text-xs font-extrabold text-[#F0F3F8] truncate block max-w-[80px]">
              {goal}
            </span>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-gray-800/80 p-3 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="block text-[11px] text-gray-500 uppercase font-mono">Difficulty</span>
            <span className="text-xs font-extrabold text-[#F0F3F8] truncate block max-w-[80px]">
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
            "flex-grow h-12 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer select-none",
            isGenerating
              ? "bg-[#6C5CE7]/50 text-gray-300 border border-gray-800 cursor-not-allowed"
              : "bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white shadow-[#6C5CE7]/15"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Generating Personalized Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Assemble AI Study Planner</span>
            </>
          )}
        </button>

        <button
          onClick={onPreviewExample}
          type="button"
          className="px-4 h-12 bg-gray-800/40 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px]"
        >
          <Eye className="w-4 h-4" />
          <span>Preview Structure</span>
        </button>
      </div>
    </div>
  );
}
