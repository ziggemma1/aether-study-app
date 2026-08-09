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
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-surface border border-border/5">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-text-main mb-2 tracking-tight">
          No notes found matching your search
        </h3>
        <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
          Try adjusting your filters, selecting a different subject, or removing tags to find matching materials.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-border/5 hover:bg-border/10 active:scale-95 text-text-main text-sm font-semibold rounded-xl border border-border/10 transition-all cursor-pointer min-h-[44px]"
            >
              <RotateCcw size={15} />
              <span>Clear Filters</span>
            </button>
          )}
          <button
            onClick={onUploadClick}
            className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg transition-all cursor-pointer min-h-[44px]"
          >
            <Upload size={15} />
            <span>Upload Material &rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-surface border border-border/5">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 border border-primary/20">
        <Compass size={28} />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2 tracking-tight">
        No community materials shared yet
      </h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
        Be the first to share your notes, PDFs, or flashcards with students around the world!
      </p>
      <button
        onClick={onUploadClick}
        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/10 transition-all cursor-pointer min-h-[44px]"
      >
        <Upload size={15} />
        <span>Share Your First Note &rarr;</span>
      </button>
    </div>
  );
}
