import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, RotateCcw, BookOpen } from 'lucide-react';

interface EmptyStateProps {
  /** Set when the library request failed. A failed request is not an empty
   *  library — this used to render "Your library is empty" with an upload CTA
   *  even when the call had merely timed out or been rate-limited. */
  error?: string | null;
  onRetry?: () => void;
}

export function EmptyState({ error, onRetry }: EmptyStateProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[var(--radius-card)] bg-surface border border-border">
        <div className="w-14 h-14 rounded-full bg-brand-pink/10 flex items-center justify-center mb-4">
          <AlertCircle size={26} className="text-brand-pink" />
        </div>
        <h3 className="text-lg font-bold mb-2 tracking-tight">
          We couldn't load your library
        </h3>
        <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3.5 bg-surface-alt hover:bg-primary/10 hover:text-primary border border-border text-text-main text-sm font-semibold rounded-xl transition-all cursor-pointer min-h-[44px]"
          >
            <RotateCcw size={16} />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[var(--radius-card)] bg-surface border border-border">
      {/* Was a 📚 emoji; the app has a real icon set. */}
      <div className="w-14 h-14 rounded-full bg-pastel-lavender flex items-center justify-center mb-4">
        <BookOpen size={26} className="text-pastel-lavender-ink" />
      </div>
      <h3 className="text-lg font-bold mb-2 tracking-tight">
        Your library is empty
      </h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
        Upload your first PDF, note, or video to get started.
      </p>
      <button
        onClick={() => navigate('/upload')}
        id="empty-state-upload-btn"
        className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer min-h-[44px]"
      >
        <Upload size={16} />
        <span>Upload material</span>
      </button>
    </div>
  );
}
