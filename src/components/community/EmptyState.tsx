import React from 'react';
import { Upload, RotateCcw, Compass } from 'lucide-react';

interface EmptyStateProps {
  type: 'search' | 'no-data';
  onClearFilters?: () => void;
  onUploadClick: () => void;
}

export function EmptyState({ type, onClearFilters, onUploadClick }: EmptyStateProps) {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-[#141A24] border border-[#8E9AAF]/5">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-[#F0F3F8] mb-2 tracking-tight">
          No notes found matching your search
        </h3>
        <p className="text-sm text-[#8E9AAF] max-w-sm mb-6 leading-relaxed">
          Try adjusting your filters, selecting a different subject, or removing tags to find matching materials.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#8E9AAF]/5 hover:bg-[#8E9AAF]/10 active:scale-95 text-[#F0F3F8] text-sm font-semibold rounded-xl border border-[#8E9AAF]/10 transition-all cursor-pointer min-h-[44px]"
            >
              <RotateCcw size={15} />
              <span>Clear Filters</span>
            </button>
          )}
          <button
            onClick={onUploadClick}
            className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 active:scale-95 text-[#F0F3F8] text-sm font-semibold rounded-xl shadow-lg transition-all cursor-pointer min-h-[44px]"
          >
            <Upload size={15} />
            <span>Upload Material &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-[#141A24] border border-[#8E9AAF]/5">
      <div className="w-16 h-16 bg-[#6C5CE7]/10 rounded-full flex items-center justify-center text-[#6C5CE7] mb-6 border border-[#6C5CE7]/20">
        <Compass size={28} />
      </div>
      <h3 className="text-lg font-bold text-[#F0F3F8] mb-2 tracking-tight">
        No community materials shared yet
      </h3>
      <p className="text-sm text-[#8E9AAF] max-w-sm mb-6 leading-relaxed">
        Be the first to share your notes, PDFs, or flashcards with students around the world!
      </p>
      <button
        onClick={onUploadClick}
        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 active:scale-95 text-[#F0F3F8] text-sm font-semibold rounded-xl shadow-lg shadow-[#6C5CE7]/10 transition-all cursor-pointer min-h-[44px]"
      >
        <Upload size={15} />
        <span>Share Your First Note &rarr;</span>
      </button>
    </div>
  );
}
